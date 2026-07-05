"""
TariffLens — FastAPI backend
============================

A thin REST wrapper around the classification engine (shared with the MCP
server). The Next.js frontend calls this directly, so the web demo works with or
without the Hermes Agent running.

Run:
    uvicorn main:app --port 8011 --reload
"""
from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Reuse the exact same engine the MCP server uses.
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp_server"))
from engine import load_engine  # noqa: E402

ENGINE = None
ENGINE_ERROR = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ENGINE, ENGINE_ERROR
    try:
        ENGINE = load_engine()
        print(f"TariffLens engine loaded: {ENGINE.store.stats()}")
    except Exception as e:  # noqa: BLE001
        ENGINE_ERROR = str(e)
        print(f"WARNING: engine not loaded: {e}")
    yield


app = FastAPI(
    title="TariffLens API",
    description="HS-code classification + duty lookup over the real USITC HTS schedule.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClassifyRequest(BaseModel):
    product: str = Field(..., min_length=1, description="Plain-English product description")
    top_k: int = Field(5, ge=1, le=10)


def _engine():
    if ENGINE is None:
        raise HTTPException(status_code=503, detail=f"Engine not ready: {ENGINE_ERROR}")
    return ENGINE


@app.get("/api/health")
def health():
    return {
        "status": "ok" if ENGINE else "degraded",
        "engine_loaded": ENGINE is not None,
        "error": ENGINE_ERROR,
    }


@app.get("/api/stats")
def stats():
    return _engine().store.stats()


@app.post("/api/classify")
def classify(req: ClassifyRequest):
    return _engine().classify(req.product, top_k=req.top_k)


@app.get("/api/duty/{hts_code}")
def duty(hts_code: str):
    return _engine().get_duty_rate(hts_code)


@app.get("/api/details/{hts_code}")
def details(hts_code: str):
    return _engine().get_hs_details(hts_code)


@app.get("/")
def root():
    return {"service": "TariffLens API", "docs": "/docs", "health": "/api/health"}