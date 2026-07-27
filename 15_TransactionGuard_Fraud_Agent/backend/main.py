"""
TransactionGuard — FastAPI backend
===================================

Wraps the LangGraph adaptive investigation agent (agent/graph.py). Each
investigation runs as a background task (202 Accepted -> WebSocket push on
completion) since the agent makes 3-6 sequential LLM calls and can take a
few seconds — real ingestion shouldn't block on that.

BYOK: every request either supplies the visitor's own OpenAI API key, or
opts into a rate-limited shared demo key (DEMO_OPENAI_API_KEY, server env,
capped via Redis) — never a personal always-on key from this service's own
.env for real investigations.

Run:
    uvicorn main:app --port 8020 --reload
"""
from __future__ import annotations

import os
import sys
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "agent"))

import auth  # noqa: E402
import db  # noqa: E402
import redis_client  # noqa: E402
from graph import build_graph, mermaid  # noqa: E402
from ws_manager import manager  # noqa: E402

STATE: dict = {"graph": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await db.init_pool()
    await redis_client.init_client()
    STATE["graph"] = build_graph()
    if pool is not None:
        await auth.bootstrap_analyst(pool)
    print(f"TransactionGuard ready · db={'on' if pool else 'off'} "
          f"· redis={'on' if redis_client.get_client() else 'off'}")
    yield
    await db.close_pool()
    await redis_client.close_client()


app = FastAPI(title="TransactionGuard API",
              description="Adaptive fraud-investigation agent (LangGraph) for digital wallet transactions.",
              version="1.0.0", lifespan=lifespan)

_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=True,
                    allow_methods=["*"], allow_headers=["*"])


# ── Schemas ───────────────────────────────────────────────────────────────

class InvestigateRequest(BaseModel):
    transaction_id: str
    openai_api_key: str = Field("", description="Visitor's own OpenAI key (BYOK) — preferred")
    use_demo_key: bool = Field(False, description="Fall back to a rate-limited shared demo key")


class LoginRequest(BaseModel):
    username: str
    password: str


class FeedbackRequest(BaseModel):
    feedback: Literal["confirmed_fraud", "false_positive"]


# ── Helpers ───────────────────────────────────────────────────────────────

async def _resolve_api_key(req: InvestigateRequest, request: Request) -> str:
    if req.openai_api_key:
        return req.openai_api_key
    if req.use_demo_key:
        client_ip = request.client.host if request.client else "unknown"
        allowed, remaining = await redis_client.check_demo_rate_limit(client_ip)
        if not allowed:
            raise HTTPException(429, "Demo key rate limit reached for this hour — "
                                      "please use your own OpenAI API key instead.")
        demo_key = os.environ.get("DEMO_OPENAI_API_KEY", "")
        if not demo_key:
            raise HTTPException(503, "Demo mode isn't configured on this server — please provide your own key.")
        return demo_key
    raise HTTPException(400, "Provide openai_api_key (your own key) or set use_demo_key=true.")


def _current_analyst(tg_analyst: Optional[str] = Cookie(None)) -> dict:
    if not tg_analyst:
        raise HTTPException(401, "Not logged in.")
    payload = auth.verify_token(tg_analyst)
    if not payload:
        raise HTTPException(401, "Session expired — please log in again.")
    return payload


async def _get_history_cached(account_id: str, before: str) -> list[dict]:
    cached = await redis_client.get_cached_history(account_id)
    if cached is not None:
        return [t for t in cached if t["occurred_at"] < before]
    history = await db.get_history(account_id)
    await redis_client.set_cached_history(account_id, history)
    return [t for t in history if t["occurred_at"] < before]


async def _run_investigation(investigation_id: str, transaction: dict, account: dict,
                              history: list[dict], api_key: str) -> None:
    initial_state = {
        "investigation_id": investigation_id,
        "transaction": transaction,
        "account": account or {},
        "history": history,
        "openai_api_key": api_key,
        "_db_pool": db.get_pool(),
    }
    try:
        result = await STATE["graph"].ainvoke(initial_state, config={"recursion_limit": 25})
        await db.complete_investigation(investigation_id, result)
        await manager.broadcast({
            "type": "investigation_complete", "investigation_id": investigation_id,
            "transaction_id": transaction["transaction_id"], "account_id": transaction["account_id"],
            "risk_level": result.get("risk_level"), "action": result.get("action"),
            "explanation": result.get("explanation"),
        })
    except Exception as e:  # noqa: BLE001
        import traceback
        traceback.print_exc()
        await db.fail_investigation(investigation_id, str(e))
        await manager.broadcast({"type": "investigation_error", "investigation_id": investigation_id,
                                  "error": str(e)})


# ── Public routes ─────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "agent_ready": STATE["graph"] is not None,
            "db": db.get_pool() is not None, "redis": redis_client.get_client() is not None}


@app.get("/api/graph")
def graph_mermaid():
    return {"mermaid": mermaid()}


@app.get("/api/stats")
async def stats():
    return await db.get_stats()


@app.get("/api/accounts")
async def accounts():
    return {"accounts": await db.list_accounts()}


@app.get("/api/transactions/history/{account_id}")
async def transaction_history(account_id: str):
    history = await db.get_history(account_id)
    if not history:
        raise HTTPException(404, "No history found for this account.")
    return {"account_id": account_id, "transactions": history}


@app.post("/api/transactions/investigate", status_code=202)
async def investigate(req: InvestigateRequest, request: Request):
    api_key = await _resolve_api_key(req, request)
    transaction = await db.get_transaction(req.transaction_id)
    if transaction is None:
        raise HTTPException(404, f"Unknown transaction_id: {req.transaction_id}")

    account = await db.get_account(transaction["account_id"])
    history = await _get_history_cached(transaction["account_id"], transaction["occurred_at"])

    investigation_id = str(uuid.uuid4())
    await db.create_investigation(investigation_id, req.transaction_id)

    import asyncio
    asyncio.create_task(_run_investigation(investigation_id, transaction, account, history, api_key))
    return {"investigation_id": investigation_id, "status": "running"}


@app.get("/api/investigations/{investigation_id}")
async def get_investigation(investigation_id: str):
    inv = await db.get_investigation(investigation_id)
    if inv is None:
        raise HTTPException(404, "Investigation not found.")
    return inv


@app.get("/api/investigations")
async def list_investigations(limit: int = 50, risk_level: Optional[str] = None, status: Optional[str] = None):
    return {"investigations": await db.list_investigations(limit=limit, risk_level=risk_level, status=status)}


@app.get("/api/precedents")
async def precedents(account_id: Optional[str] = None, limit: int = 20):
    return {"precedents": await db.get_precedents(account_id=account_id, limit=limit)}


@app.get("/api/eval/accuracy")
async def eval_accuracy():
    """Compares completed investigations' verdicts against the synthetic ground-truth
    labels (transactions.is_synthetic_anomaly) — for the README's accuracy claim."""
    pool = db.get_pool()
    if pool is None:
        return {"available": False}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """select t.is_synthetic_anomaly, i.risk_level
               from investigations i join transactions t on t.transaction_id = i.transaction_id
               where i.status = 'complete'""")
    if not rows:
        return {"available": False}
    flagged = lambda r: r["risk_level"] in ("MEDIUM", "HIGH")  # noqa: E731
    tp = sum(1 for r in rows if r["is_synthetic_anomaly"] and flagged(r))
    fp = sum(1 for r in rows if not r["is_synthetic_anomaly"] and flagged(r))
    fn = sum(1 for r in rows if r["is_synthetic_anomaly"] and not flagged(r))
    tn = sum(1 for r in rows if not r["is_synthetic_anomaly"] and not flagged(r))
    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    return {"available": True, "evaluated": len(rows), "true_positive": tp, "false_positive": fp,
            "false_negative": fn, "true_negative": tn, "precision": precision, "recall": recall}


@app.websocket("/ws/investigations")
async def ws_investigations(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive; client doesn't need to send anything meaningful
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ── Analyst auth + feedback ──────────────────────────────────────────────

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    pool = db.get_pool()
    if pool is None:
        raise HTTPException(503, "Database not configured.")
    analyst = await auth.authenticate(pool, req.username, req.password)
    if not analyst:
        raise HTTPException(401, "Invalid username or password.")
    token = auth.create_token(analyst["id"], analyst["username"])
    resp = Response(content='{"ok": true}', media_type="application/json")
    resp.set_cookie(auth.ANALYST_COOKIE, token, httponly=True,
                     samesite=os.environ.get("COOKIE_SAMESITE", "none"),
                     secure=os.environ.get("COOKIE_SECURE", "true").lower() == "true",
                     max_age=auth.EXPIRY_SECONDS)
    return resp


@app.post("/api/auth/logout")
async def logout():
    resp = Response(content='{"ok": true}', media_type="application/json")
    resp.delete_cookie(auth.ANALYST_COOKIE)
    return resp


@app.get("/api/auth/session")
def session(analyst: dict = Depends(_current_analyst)):
    return {"username": analyst["username"]}


@app.post("/api/investigations/{investigation_id}/feedback")
async def feedback(investigation_id: str, req: FeedbackRequest, analyst: dict = Depends(_current_analyst)):
    inv = await db.get_investigation(investigation_id)
    if inv is None:
        raise HTTPException(404, "Investigation not found.")
    await db.set_feedback(investigation_id, req.feedback, analyst["sub"])
    return {"ok": True}


@app.get("/")
def root():
    return {"service": "TransactionGuard API", "docs": "/docs", "health": "/api/health"}