import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.redis_client import get_redis, close_redis
from core.logger import get_logger, request_id_var
from api.v1 import health, prescription, knowledge, tts

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Multimodal Medical Reference Agent starting")
    await get_redis()
    yield
    await close_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Multimodal Medical Reference Agent",
    description="Prescription reading, mixed-PDF intelligence, and multimodal RAG for medical staff.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    rid = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    request_id_var.set(rid)
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=str(request.url))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(prescription.router, prefix="/api/v1", tags=["Prescription"])
app.include_router(knowledge.router, prefix="/api/v1", tags=["Knowledge"])
app.include_router(tts.router, prefix="/api/v1", tags=["TTS"])


@app.get("/")
async def root():
    return {
        "service": "Multimodal Medical Reference Agent",
        "version": "1.0.0",
        "docs": "/docs",
        "capabilities": [
            "Prescription reading (image + voice)",
            "Mixed PDF ingestion",
            "Multimodal RAG retrieval",
        ],
    }