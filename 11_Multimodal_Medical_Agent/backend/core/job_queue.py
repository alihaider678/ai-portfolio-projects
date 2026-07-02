import json
import uuid
from .redis_client import get_redis

JOB_TTL = 7200  # 2 hours


async def create_job(meta: dict) -> str:
    job_id = str(uuid.uuid4())
    redis = await get_redis()
    await redis.hset(f"job:{job_id}", mapping={
        "status": "pending",
        "meta": json.dumps(meta),
        "result": "",
        "error": "",
    })
    await redis.expire(f"job:{job_id}", JOB_TTL)
    return job_id


async def update_job(job_id: str, status: str, result: dict | None = None, error: str = ""):
    redis = await get_redis()
    mapping = {"status": status, "error": error}
    if result is not None:
        mapping["result"] = json.dumps(result)
    await redis.hset(f"job:{job_id}", mapping=mapping)
    await redis.expire(f"job:{job_id}", JOB_TTL)


async def get_job(job_id: str) -> dict | None:
    redis = await get_redis()
    data = await redis.hgetall(f"job:{job_id}")
    if not data:
        return None
    return {
        "job_id": job_id,
        "status": data.get("status", "unknown"),
        "result": json.loads(data["result"]) if data.get("result") else None,
        "error": data.get("error", ""),
    }