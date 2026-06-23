import uuid
import json
import os
import tempfile
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from vectorstore.chroma_store import ingest_documents
from agents.support_agent import run_agent
from agents.streaming_agent import stream_agent_response
from memory.conversation_memory import clear_memory

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed ChromaDB with demo data on every startup (safe: skips if already populated)
    try:
        from data.seed_demo_kb import seed_if_empty
        seed_if_empty()
    except Exception as e:
        logger.warning(f"Startup seed failed (non-fatal): {e}")
    yield


app = FastAPI(
    title="Enterprise Customer Support Agent",
    description="LangGraph + RAG + Redis + Celery — streaming-capable support agent with sentiment detection and escalation",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str
    message: str
    api_key: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str
    sentiment: str
    escalated: bool
    case_id: str | None


class SessionResponse(BaseModel):
    session_id: str


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Sessions ──────────────────────────────────────────────────────────────────

@app.post("/session/new", response_model=SessionResponse)
def new_session():
    return {"session_id": str(uuid.uuid4())}


@app.delete("/session/{session_id}")
def end_session(session_id: str):
    clear_memory(session_id)
    return {"message": "Session cleared"}


# ── Chat (standard JSON) ──────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        result = run_agent(session_id=request.session_id, user_message=request.message, api_key=request.api_key)
        return ChatResponse(
            session_id=request.session_id,
            response=result["response"],
            sentiment=result["sentiment"],
            escalated=result["escalated"],
            case_id=result.get("case_id"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Chat (Server-Sent Events streaming) ──────────────────────────────────────

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streams the agent response token by token via Server-Sent Events.

    Event format:
      data: {"type": "token", "token": "Hello"}
      data: {"type": "done", "escalated": false, "case_id": null, "sentiment": "neutral"}
      data: [DONE]
    """
    async def event_generator():
        try:
            async for event in stream_agent_response(request.session_id, request.message, request.api_key):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Knowledge Base ────────────────────────────────────────────────────────────

@app.post("/knowledge-base/upload")
async def upload_knowledge_base(file: UploadFile = File(...)):
    """
    Uploads a PDF or TXT file to the knowledge base.
    Text splitting is done synchronously; embedding ingestion is dispatched
    to a Celery worker for non-blocking processing.
    """
    allowed = {".pdf", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path) if ext == ".pdf" else TextLoader(tmp_path)
        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        chunks = splitter.split_documents(documents)

        texts = [c.page_content for c in chunks]
        metadatas = [c.metadata for c in chunks]

        # Try Celery async ingestion; fall back to sync if worker unavailable
        try:
            from tasks.kb_tasks import ingest_kb
            task = ingest_kb.delay(texts, metadatas)
            return {
                "message": f"Ingestion queued — {len(chunks)} chunks from {file.filename}",
                "task_id": task.id,
                "async": True,
            }
        except Exception:
            ingest_documents(chunks)
            return {
                "message": f"Ingested {len(chunks)} chunks from {file.filename}",
                "async": False,
            }
    finally:
        os.unlink(tmp_path)


@app.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    """Check the status of an async Celery task (e.g. KB ingestion)."""
    try:
        from celery_app import celery_app
        result = celery_app.AsyncResult(task_id)
        return {
            "task_id": task_id,
            "status": result.status,
            "result": result.result if result.ready() else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))