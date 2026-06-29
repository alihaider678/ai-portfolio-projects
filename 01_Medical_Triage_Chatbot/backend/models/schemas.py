from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from pydantic import BaseModel


class TriageState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    session_id: str
    api_key: str
    # Interview state
    collected_symptoms: dict
    questions_asked: list[str]
    turn_count: int
    is_complete: bool
    # RAG + analysis
    rag_context: str
    triage_level: str | None        # "emergency" | "urgent" | "routine"
    probable_conditions: list[str]
    recommendations: list[str]
    # Response payload
    response_text: str
    response_type: str              # "question" | "triage"


# ── API request / response models ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    api_key: str


class ChatResponse(BaseModel):
    type: str                       # "question" | "triage"
    message: str
    triage_level: str | None = None
    probable_conditions: list[str] = []
    recommendations: list[str] = []
    turn_count: int = 0
    collected_symptoms: dict = {}


# ── Redis session snapshot ─────────────────────────────────────────────────────

class SessionSnapshot(BaseModel):
    messages: list[dict] = []
    collected_symptoms: dict = {}
    questions_asked: list[str] = []
    turn_count: int = 0
    is_complete: bool = False
    triage_level: str | None = None
    probable_conditions: list[str] = []
    recommendations: list[str] = []