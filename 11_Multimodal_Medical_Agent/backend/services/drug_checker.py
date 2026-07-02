import httpx
from core.config import settings
from core.logger import get_logger

logger = get_logger("drug_checker")
TIMEOUT = 120.0  # Project 02 jobs can take 30-60s


async def check_interactions(drugs: list[str], openai_api_key: str) -> dict:
    """
    Call Project 02 (RxSafe AI) to check drug interactions.
    Returns the full job result or raises on failure.
    """
    base = settings.drug_checker_url.rstrip("/")

    payload = {
        "drugs": drugs,
        "patient_profile": {},
        "api_key": openai_api_key,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # Submit job
        resp = await client.post(f"{base}/api/v1/analyze", json=payload)
        resp.raise_for_status()
        job = resp.json()
        job_id = job["job_id"]
        logger.info("Drug check job submitted", job_id=job_id, drug_count=len(drugs))

        # Poll until complete
        import asyncio
        for _ in range(60):  # max 2.5 min
            await asyncio.sleep(3)
            poll = await client.get(f"{base}/api/v1/jobs/{job_id}")
            poll.raise_for_status()
            data = poll.json()
            if data["status"] == "complete":
                return data["result"]
            if data["status"] == "failed":
                raise RuntimeError(f"Drug check failed: {data.get('error', 'unknown')}")

    raise TimeoutError("Drug interaction check timed out after 3 minutes")