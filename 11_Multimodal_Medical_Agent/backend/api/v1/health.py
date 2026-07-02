from fastapi import APIRouter
from core.redis_client import get_redis
from services.vector_store import get_chunk_count

router = APIRouter()


@router.get("/health")
async def health():
    redis_status = "ok"
    try:
        r = await get_redis()
        await r.ping()
    except Exception as e:
        redis_status = f"error: {e}"

    return {
        "status": "ok",
        "redis": redis_status,
        "service": "Multimodal Medical Reference Agent",
    }