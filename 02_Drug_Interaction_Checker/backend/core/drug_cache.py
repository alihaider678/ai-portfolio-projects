import json

from .config import settings
from .redis_client import get_redis
from .logger import logger


def _cache_key(drug_a: str, drug_b: str) -> str:
    # Sort alphabetically so warfarin+aspirin == aspirin+warfarin
    pair = sorted([drug_a.lower().strip(), drug_b.lower().strip()])
    return f"drug_cache:{pair[0]}:{pair[1]}"


async def get_cached_pair(drug_a: str, drug_b: str) -> dict | None:
    redis = await get_redis()
    raw = await redis.get(_cache_key(drug_a, drug_b))
    if raw:
        logger.info(f"Cache HIT | pair={drug_a}+{drug_b}")
        result = json.loads(raw)
        result["cached"] = True
        return result
    return None


async def set_cached_pair(drug_a: str, drug_b: str, result: dict) -> None:
    redis = await get_redis()
    # Strip patient-specific adjustments before caching — base interaction is universal
    cacheable = {k: v for k, v in result.items() if k != "patient_adjustments"}
    await redis.setex(
        _cache_key(drug_a, drug_b),
        settings.drug_cache_ttl,
        json.dumps(cacheable),
    )
    logger.info(f"Cache SET | pair={drug_a}+{drug_b} | ttl={settings.drug_cache_ttl}s")