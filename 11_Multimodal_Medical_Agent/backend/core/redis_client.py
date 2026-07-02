from __future__ import annotations

import redis.asyncio as aioredis
from .config import settings
from .logger import get_logger

logger = get_logger("redis")
_client = None


async def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await _client.ping()
        logger.info("Redis connection verified")
    return _client


async def close_redis():
    global _client
    if _client:
        await _client.aclose()
        _client = None