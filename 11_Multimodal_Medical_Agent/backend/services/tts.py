from openai import AsyncOpenAI
from elevenlabs.client import AsyncElevenLabs
from elevenlabs import VoiceSettings


DEFAULT_ELEVENLABS_VOICE = "21m00Tcm4TlvDq8ikWAM"  # Rachel — calm, clinical


async def synthesize_openai(text: str, openai_api_key: str) -> bytes:
    """Generate speech using OpenAI TTS (tts-1-hd, alloy voice)."""
    client = AsyncOpenAI(api_key=openai_api_key)
    response = await client.audio.speech.create(
        model="tts-1-hd",
        voice="alloy",
        input=text,
        response_format="mp3",
    )
    return response.content


async def synthesize_elevenlabs(
    text: str,
    elevenlabs_api_key: str,
    voice_id: str = DEFAULT_ELEVENLABS_VOICE,
) -> bytes:
    """Generate speech using ElevenLabs API."""
    client = AsyncElevenLabs(api_key=elevenlabs_api_key)
    audio = await client.generate(
        text=text,
        voice=voice_id,
        voice_settings=VoiceSettings(stability=0.6, similarity_boost=0.8),
        model_id="eleven_multilingual_v2",
    )
    # audio is an async generator — collect all chunks
    chunks = []
    async for chunk in audio:
        chunks.append(chunk)
    return b"".join(chunks)


async def synthesize(
    text: str,
    provider: str,
    openai_api_key: str,
    elevenlabs_api_key: str | None = None,
    voice_id: str | None = None,
) -> bytes:
    """Unified TTS entry point."""
    if provider == "elevenlabs":
        if not elevenlabs_api_key:
            raise ValueError("ElevenLabs API key required when provider='elevenlabs'")
        return await synthesize_elevenlabs(text, elevenlabs_api_key, voice_id or DEFAULT_ELEVENLABS_VOICE)
    return await synthesize_openai(text, openai_api_key)