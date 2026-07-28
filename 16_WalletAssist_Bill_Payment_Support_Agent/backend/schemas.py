from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=2000)
    account_id: Optional[str] = None
    openai_api_key: str = ""
    use_demo_key: bool = False


class ChatResponse(BaseModel):
    session_id: str
    response: str
    intent: str
    path_taken: str  # "faq" | "tool" | "escalation" | "clarification"
    retrieved_faqs: Optional[list[dict]] = None
    transaction_result: Optional[dict] = None


class Account(BaseModel):
    account_id: str
    display_name: str
    transaction_count: int


class Transaction(BaseModel):
    transaction_id: str
    account_id: str
    method: str
    biller: Optional[str] = None
    amount: float
    currency: str
    status: str
    reason_code: Optional[str] = None
    reason_text: Optional[str] = None
    occurred_at: str


class IngestRequest(BaseModel):
    openai_api_key: str = Field(..., min_length=1)


class IngestResponse(BaseModel):
    status: str
    entries_indexed: int


class Health(BaseModel):
    status: str
    agent_ready: bool
    knowledge_base_loaded: bool