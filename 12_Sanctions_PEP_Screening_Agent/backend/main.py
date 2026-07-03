"""
AegisScreen — FastAPI backend
=============================

A thin REST wrapper around the screening engine (shared with the MCP server).
The frontend calls this directly, so the demo works with or without the
Hermes Agent running.

Run:
    uvicorn main:app --port 8010 --reload
"""
from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Reuse the exact same screening engine the MCP server uses.
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp_server"))
import matcher                       # noqa: E402
from datastore import load_store     # noqa: E402

# Loaded once at startup and reused across requests.
STORE = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global STORE
    try:
        STORE = load_store()
        print(f"Screening data loaded: {STORE.stats()}")
    except FileNotFoundError as e:
        print(f"WARNING: {e}")
    yield


app = FastAPI(
    title="AegisScreen API",
    description="Trade sanctions & PEP screening over real OFAC + OpenSanctions data.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EntityType = Literal["any", "person", "organization"]


class ScreenRequest(BaseModel):
    name: str = Field(..., min_length=1, examples=["Rosoboronexport"])
    entity_type: EntityType = "any"
    limit: int = Field(5, ge=1, le=25)


class BatchScreenRequest(BaseModel):
    names: list[str] = Field(..., min_length=1, max_length=200)
    entity_type: EntityType = "any"


def _require_store():
    if STORE is None:
        raise HTTPException(
            status_code=503,
            detail="Screening data not loaded. Run `python ingest.py` in mcp_server/.",
        )
    return STORE


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "data_loaded": STORE is not None,
        "entities": STORE.stats()["total_entities"] if STORE else 0,
    }


@app.get("/api/stats")
def stats():
    return _require_store().stats()


@app.post("/api/screen")
def screen(req: ScreenRequest):
    """Screen one entity against sanctions + PEP lists."""
    return matcher.screen(
        _require_store(), req.name, entity_type=req.entity_type, limit=req.limit
    )


@app.post("/api/batch-screen")
def batch_screen(req: BatchScreenRequest):
    """Screen many names; returns per-name results + a risk summary."""
    store = _require_store()
    results = [matcher.screen(store, n, entity_type=req.entity_type, limit=3) for n in req.names]
    summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in results:
        summary[r["overall_risk"]] += 1
    return {
        "screened": len(req.names),
        "risk_summary": summary,
        "results": results,
    }


@app.get("/api/entity/{entity_id}")
def entity(entity_id: str):
    rec = _require_store().get_by_id(entity_id)
    if not rec:
        raise HTTPException(404, f"No entity with id '{entity_id}'.")
    return rec


@app.get("/")
def root():
    return {"service": "AegisScreen API", "docs": "/docs", "health": "/api/health"}