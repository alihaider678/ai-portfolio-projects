import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.v1.analyze import router as analyze_router
from api.v1.health import router as health_router
from core.logger import logger, request_id_var
from core.redis_client import close_redis, get_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info("Drug Interaction Checker API starting")
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connection verified")
    except Exception as exc:
        logger.error(f"Redis connection failed on startup: {exc}")

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────
    await close_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Drug Interaction & Prescription Safety Checker",
    description=(
        "Parallel LangGraph agents query OpenFDA + PubMed in real time, "
        "run an autonomous research loop when confidence is low, "
        "and generate a clinician-grade PDF safety report."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Correlation ID middleware ───────────────────────────────────────────────
# Every request gets a UUID. It is propagated through all log lines
# and returned in the X-Request-ID response header for client-side tracing.
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_var.set(req_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(analyze_router, prefix="/api/v1", tags=["Analysis"])


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Drug Interaction & Prescription Safety Checker",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }