"""
LicenseGuard — FastAPI backend
==============================

REST wrapper around the LangGraph agent. Each /api/check-license request runs
the full graph (parse → check country → classify product → combine → explain)
and returns the decision PLUS the step-by-step reasoning trace, so the web UI
can render the agent's reasoning graph rather than a black-box answer.

By default the graph runs over the in-process rules engine (DirectTools) — one
reliable, self-contained service to deploy. Set LICENSEGUARD_BACKEND=mcp to make
the graph call the tools over MCP instead.

Run:
    uvicorn main:app --port 8012 --reload
"""
from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "agent"))
sys.path.insert(0, str(ROOT / "mcp_server"))

from config import setup_langsmith  # noqa: E402
from graph import build_graph, mermaid, run_query  # noqa: E402
from tools import make_tools  # noqa: E402

STATE: dict = {"graph": None, "tools": None, "error": None, "tracing": False}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        STATE["tracing"] = setup_langsmith()
        STATE["tools"] = make_tools(os.environ.get("LICENSEGUARD_BACKEND", "direct"))
        STATE["graph"] = build_graph(STATE["tools"])
        print(f"LicenseGuard agent ready · backend={STATE['tools'].backend_name} "
              f"· LangSmith={'on' if STATE['tracing'] else 'off'}")
    except Exception as e:  # noqa: BLE001
        STATE["error"] = str(e)
        print(f"WARNING: agent not ready: {e}")
    yield
    if STATE["tools"]:
        STATE["tools"].close()


app = FastAPI(
    title="LicenseGuard API",
    description="Export-license determination via a LangGraph agent over MCP tools.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class CheckRequest(BaseModel):
    product_description: str = Field("", description="Plain-English product/technology")
    destination_country: str = Field("", description="Destination country")
    query: str = Field("", description="Optional free-text question (parsed if the two fields are empty)")
    openai_api_key: str = Field("", description="Optional: visitor's own OpenAI key, used only for this request")


def _graph():
    if STATE["graph"] is None:
        raise HTTPException(status_code=503, detail=f"Agent not ready: {STATE['error']}")
    return STATE["graph"]


@app.get("/api/health")
def health():
    from config import has_openai_key
    return {
        "status": "ok" if STATE["graph"] else "degraded",
        "agent_ready": STATE["graph"] is not None,
        "backend": STATE["tools"].backend_name if STATE["tools"] else None,
        "langsmith": STATE["tracing"],
        "server_has_key": has_openai_key(),
        "error": STATE["error"],
    }


@app.get("/api/stats")
def stats():
    from rules_engine import load_engine
    return load_engine().stats()


@app.get("/api/countries")
def countries():
    """Known countries (name + restriction level) for the UI picker."""
    from rules_engine import load_engine
    eng = load_engine()
    items = [
        {"name": rec["name"], "level": rec["level"]}
        for rec in eng.countries.values()
    ]
    items.sort(key=lambda x: x["name"])
    return {"countries": items, "default_level": eng.default_level}


@app.get("/api/graph")
def graph_mermaid():
    return {"mermaid": mermaid()}


@app.post("/api/check-license")
def check_license(req: CheckRequest):
    if not (req.query or (req.product_description and req.destination_country)):
        raise HTTPException(status_code=422,
                            detail="Provide product_description + destination_country, or a query.")
    try:
        return run_query(_graph(), query=req.query,
                         product=req.product_description, country=req.destination_country,
                         api_key=req.openai_api_key)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"service": "LicenseGuard API", "docs": "/docs", "health": "/api/health"}