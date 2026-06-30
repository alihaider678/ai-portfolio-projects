import base64
import json
import uuid
from enum import Enum

from .config import settings
from .redis_client import get_redis


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


def _key(job_id: str) -> str:
    return f"job:drug:{job_id}"


async def create_job(drugs: list[str]) -> str:
    job_id = str(uuid.uuid4())
    redis = await get_redis()
    await redis.hset(
        _key(job_id),
        mapping={
            "status": JobStatus.PENDING,
            "drugs": json.dumps(drugs),
            "result": "",
            "error": "",
            "pdf": "",
        },
    )
    await redis.expire(_key(job_id), settings.job_ttl)
    return job_id


async def update_job_status(
    job_id: str,
    status: JobStatus,
    result: dict | None = None,
    error: str | None = None,
) -> None:
    redis = await get_redis()
    mapping: dict = {"status": status}
    if result is not None:
        mapping["result"] = json.dumps(result)
    if error is not None:
        mapping["error"] = error
    await redis.hset(_key(job_id), mapping=mapping)


async def store_job_pdf(job_id: str, pdf_bytes: bytes) -> None:
    redis = await get_redis()
    await redis.hset(_key(job_id), "pdf", base64.b64encode(pdf_bytes).decode())


async def get_job(job_id: str) -> dict | None:
    redis = await get_redis()
    data = await redis.hgetall(_key(job_id))
    if not data:
        return None
    out: dict = {
        "job_id": job_id,
        "status": data.get("status"),
        "drugs": json.loads(data.get("drugs", "[]")),
        "error": data.get("error") or None,
    }
    if data.get("result"):
        out["result"] = json.loads(data["result"])
    return out


async def get_job_pdf(job_id: str) -> bytes | None:
    redis = await get_redis()
    pdf_b64 = await redis.hget(_key(job_id), "pdf")
    if not pdf_b64:
        return None
    return base64.b64decode(pdf_b64)