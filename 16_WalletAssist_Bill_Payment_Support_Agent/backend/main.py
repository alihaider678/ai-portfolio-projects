"""
WalletAssist — FastAPI backend
================================

Wraps the LangGraph intent-routing agent (agent/graph.py). Chat is a simple
synchronous request/response (unlike TransactionGuard's investigate endpoint,
there's no multi-step loop here — classify + one retrieval/tool call +
compose is 2-3 fast LLM calls, no background task needed).

BYOK: every request either supplies the visitor's own OpenAI API key, or opts
into a rate-limited shared demo key (DEMO_OPENAI_API_KEY, server env, capped
via a SQLite counter) — never a personal always-on key from this service's
own .env for real chat traffic.

Run:
    uvicorn main:app --port 8010 --reload
"""
from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "agent"))

import db  # noqa: E402
from graph import build_graph, mermaid  # noqa: E402
from knowledge_base import get_knowledge_base  # noqa: E402
from schemas import ChatRequest, ChatResponse, Health, IngestRequest, IngestResponse, Transaction  # noqa: E402

STATE: dict = {"graph": None, "kb_ready": False}
DEMO_RATE_LIMIT_PER_HOUR = 5


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    STATE["graph"] = build_graph()
    try:
        get_knowledge_base()
        STATE["kb_ready"] = True
    except FileNotFoundError as e:
        print(f"WARNING: knowledge base not built yet — FAQ answers will fail. {e}")
    print(f"WalletAssist ready · kb={'on' if STATE['kb_ready'] else 'MISSING'}")
    yield


app = FastAPI(title="WalletAssist API",
              description="RAG + tool-calling wallet/bill-payment support agent (LangGraph).",
              version="1.0.0", lifespan=lifespan)

_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=True,
                    allow_methods=["*"], allow_headers=["*"])


# ── Helpers ───────────────────────────────────────────────────────────────

async def _resolve_api_key(req: ChatRequest, request: Request) -> str:
    if req.openai_api_key:
        return req.openai_api_key
    if req.use_demo_key:
        client_ip = request.client.host if request.client else "unknown"
        allowed = await db.check_and_increment_demo_usage(client_ip, DEMO_RATE_LIMIT_PER_HOUR)
        if not allowed:
            raise HTTPException(429, "Demo key rate limit reached for this hour — "
                                      "please use your own OpenAI API key instead.")
        demo_key = os.environ.get("DEMO_OPENAI_API_KEY", "")
        if not demo_key:
            raise HTTPException(503, "Demo mode isn't configured on this server — please provide your own key.")
        return demo_key
    raise HTTPException(400, "Provide openai_api_key (your own key) or set use_demo_key=true.")


# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=Health)
async def health():
    return Health(status="ok", agent_ready=STATE["graph"] is not None, knowledge_base_loaded=STATE["kb_ready"])


@app.get("/api/graph")
def graph_mermaid():
    return {"mermaid": mermaid()}


@app.get("/api/accounts", response_model=dict)
async def accounts():
    return {"accounts": await db.list_accounts()}


@app.get("/api/transactions/{transaction_id}/status", response_model=Transaction)
async def transaction_status(transaction_id: str):
    txn = await db.get_transaction(transaction_id=transaction_id)
    if txn is None:
        raise HTTPException(404, f"Unknown transaction_id: {transaction_id}")
    return txn


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    if not STATE["kb_ready"]:
        raise HTTPException(503, "Knowledge base not built — run agent/build_index.py first.")
    api_key = await _resolve_api_key(req, request)

    await db.ensure_session(req.session_id)
    history = await db.get_session_history(req.session_id)
    await db.log_message(req.session_id, "user", req.message)

    initial_state = {
        "session_id": req.session_id,
        "message": req.message,
        "history": history,
        "account_id": req.account_id,
        "openai_api_key": api_key,
        "_lookup_transaction": db.get_transaction,  # async — awaited directly by the lookup_transaction node
    }
    result = await STATE["graph"].ainvoke(initial_state, config={"recursion_limit": 15})

    await db.log_message(req.session_id, "assistant", result["response"], result.get("path_taken"))
    await db.log_turn(
        req.session_id, result.get("intent", ""), result.get("path_taken", ""),
        req.account_id, result.get("extracted_transaction_id"),
    )

    return ChatResponse(
        session_id=req.session_id,
        response=result["response"],
        intent=result.get("intent", ""),
        path_taken=result.get("path_taken", ""),
        retrieved_faqs=result.get("retrieved_faqs"),
        transaction_result=result.get("transaction_result"),
    )


@app.post("/api/knowledge/ingest", response_model=IngestResponse)
async def ingest_knowledge(req: IngestRequest):
    """Admin endpoint: rebuild the FAQ vector index in-process (owner key only —
    this is a one-time-per-content-change build step, not per-visitor usage)."""
    import build_index

    os.environ["OPENAI_API_KEY"] = req.openai_api_key
    build_index.main()

    import knowledge_base
    knowledge_base._kb = None  # force reload on next get_knowledge_base()
    kb = get_knowledge_base()
    STATE["kb_ready"] = True
    return IngestResponse(status="ok", entries_indexed=len(kb.records))


@app.get("/")
def root():
    return {"service": "WalletAssist API", "docs": "/docs", "health": "/api/health"}