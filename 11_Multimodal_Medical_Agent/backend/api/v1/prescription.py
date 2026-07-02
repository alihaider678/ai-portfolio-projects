import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from core.job_queue import create_job, update_job, get_job
from agents import prescription_agent

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/m4a"}
MAX_FILE_MB = 20


@router.post("/prescription/analyze")
async def analyze_prescription(
    file: UploadFile = File(...),
    input_type: str = Form(...),          # "image" | "audio"
    tts_provider: str = Form("openai"),   # "openai" | "elevenlabs"
    openai_api_key: str = Form(...),
    elevenlabs_api_key: str = Form(""),
    voice_id: str = Form(""),
):
    # Validate input type
    if input_type not in ("image", "audio"):
        raise HTTPException(400, "input_type must be 'image' or 'audio'")
    if tts_provider not in ("openai", "elevenlabs"):
        raise HTTPException(400, "tts_provider must be 'openai' or 'elevenlabs'")
    if tts_provider == "elevenlabs" and not elevenlabs_api_key:
        raise HTTPException(400, "elevenlabs_api_key required when tts_provider='elevenlabs'")

    # Validate file type
    content_type = file.content_type or ""
    if input_type == "image" and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Unsupported image type: {content_type}")
    if input_type == "audio" and content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(400, f"Unsupported audio type: {content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_FILE_MB}MB.")

    job_id = await create_job({"input_type": input_type, "filename": file.filename})

    asyncio.create_task(_run_job(
        job_id=job_id,
        input_type=input_type,
        file_bytes=file_bytes,
        filename=file.filename or "upload",
        tts_provider=tts_provider,
        openai_api_key=openai_api_key,
        elevenlabs_api_key=elevenlabs_api_key or None,
        voice_id=voice_id or None,
    ))

    return {"job_id": job_id, "status": "pending", "message": "Prescription analysis started"}


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


async def _run_job(job_id: str, **kwargs):
    await update_job(job_id, "running")
    try:
        result = await prescription_agent.run(**kwargs)
        await update_job(job_id, "complete", result=result)
    except Exception as e:
        await update_job(job_id, "failed", error=str(e))