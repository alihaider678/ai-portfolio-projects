from fastapi import APIRouter

from core.redis_client import get_redis

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        redis = await get_redis()
        await redis.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status": "ok" if redis_ok else "degraded",
        "redis": "ok" if redis_ok else "error",
        "service": "drug-interaction-checker",
        "version": "1.0.0",
    }