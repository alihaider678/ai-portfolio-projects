import time
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import Response

from agents.graph import graph
from core.job_queue import (
    JobStatus,
    create_job,
    get_job,
    get_job_pdf,
    store_job_pdf,
    update_job_status,
)
from core.logger import logger, request_id_var
from core.rate_limiter import check_rate_limit
from models.requests import AnalyzeRequest

router = APIRouter()


async def _run_analysis(job_id: str, req: AnalyzeRequest, request_id: str) -> None:
    """
    Background task: invoke the LangGraph pipeline and persist the result.
    Runs entirely outside the HTTP request-response cycle.
    """
    request_id_var.set(request_id)
    start = time.time()

    drugs = [d.strip().lower() for d in req.drugs]
    n_pairs = len(drugs) * (len(drugs) - 1) // 2

    try:
        await update_job_status(job_id, JobStatus.RUNNING)
        logger.info(f"Analysis START | job={job_id} | drugs={drugs} | pairs={n_pairs}")

        initial_state = {
            "drugs": drugs,
            "patient_profile": req.patient_profile.model_dump(),
            "api_key": req.api_key,
            "request_id": request_id,
            "current_pair": [],
            "pair_results": [],
            "synthesis": None,
            "pdf_bytes": None,
            "error": None,
        }

        result = await graph.ainvoke(initial_state)

        # Persist JSON result (PDF stored separately to avoid huge Redis values)
        result_payload = {
            "overall_risk": result["synthesis"]["overall_risk"],
            "risk_label": result["synthesis"]["risk_label"],
            "severity_counts": result["synthesis"]["severity_counts"],
            "clinical_summary": result["synthesis"]["clinical_summary"],
            "total_pairs": result["synthesis"]["total_pairs"],
            "pair_results": result["synthesis"]["sorted_results"],
            "drugs": drugs,
        }

        await update_job_status(job_id, JobStatus.COMPLETE, result=result_payload)

        if result.get("pdf_bytes"):
            await store_job_pdf(job_id, result["pdf_bytes"])

        elapsed = time.time() - start
        logger.info(
            f"Analysis DONE | job={job_id} | duration={elapsed:.1f}s | risk={result['synthesis']['overall_risk']}"
        )

    except Exception as exc:
        elapsed = time.time() - start
        logger.error(f"Analysis FAILED | job={job_id} | duration={elapsed:.1f}s | err={exc}")
        await update_job_status(job_id, JobStatus.FAILED, error=str(exc)[:500])


# ── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/analyze")
async def submit_analysis(
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    request: Request,
):
    """
    Submit a drug interaction analysis job.
    Returns a job_id immediately — poll GET /jobs/{job_id} for results.
    """
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = await check_rate_limit(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )

    if len(body.drugs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 drugs are required.")
    if len(body.drugs) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 drugs per analysis.")

    request_id = str(uuid.uuid4())
    request_id_var.set(request_id)

    n_pairs = len(body.drugs) * (len(body.drugs) - 1) // 2
    job_id = await create_job(body.drugs)

    logger.info(
        f"Job queued | job={job_id} | req={request_id} | drugs={body.drugs} | pairs={n_pairs} | ip={client_ip}"
    )

    background_tasks.add_task(_run_analysis, job_id, body, request_id)

    return {
        "job_id": job_id,
        "status": "pending",
        "request_id": request_id,
        "pairs": n_pairs,
        "message": f"Analysis queued for {len(body.drugs)} drugs ({n_pairs} pairs). Poll /api/v1/jobs/{job_id} for results.",
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Poll for job status. Returns results when status == 'complete'."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired (TTL: 2h).")

    response: dict = {
        "job_id": job_id,
        "status": job["status"],
        "drugs": job["drugs"],
    }

    if job["status"] == JobStatus.COMPLETE:
        response["result"] = job.get("result")
        response["pdf_url"] = f"/api/v1/jobs/{job_id}/report"

    if job["status"] == JobStatus.FAILED:
        response["error"] = job.get("error")

    return response


@router.get("/jobs/{job_id}/report")
async def download_pdf_report(job_id: str):
    """Download the generated PDF safety report."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    if job["status"] != JobStatus.COMPLETE:
        raise HTTPException(
            status_code=400,
            detail=f"Report not ready. Job status: {job['status']}",
        )

    pdf_bytes = await get_job_pdf(job_id)
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="PDF not found — may have expired.")

    filename = f"drug-interaction-report-{job_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )