from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import StreamingResponse
from services.tts import synthesize
import io

router = APIRouter()


@router.post("/tts/synthesize")
async def tts_synthesize(
    text: str = Form(...),
    provider: str = Form("openai"),
    openai_api_key: str = Form(...),
    elevenlabs_api_key: str = Form(""),
    voice_id: str = Form(""),
):
    """Synthesize text to speech — returns MP3 audio file directly (for testing)."""
    if provider == "elevenlabs" and not elevenlabs_api_key:
        raise HTTPException(400, "elevenlabs_api_key required when provider='elevenlabs'")

    audio_bytes = await synthesize(
        text=text,
        provider=provider,
        openai_api_key=openai_api_key,
        elevenlabs_api_key=elevenlabs_api_key or None,
        voice_id=voice_id or None,
    )

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=speech.mp3"},
    )