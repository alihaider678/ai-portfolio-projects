from pydantic import BaseModel
from typing import Literal


class TTSRequest(BaseModel):
    text: str
    provider: Literal["openai", "elevenlabs"] = "openai"
    openai_api_key: str
    elevenlabs_api_key: str | None = None
    voice_id: str | None = None  # ElevenLabs voice ID


class RAGQueryRequest(BaseModel):
    query: str
    openai_api_key: str
    top_k: int = 3


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    redis: str
    chroma: str