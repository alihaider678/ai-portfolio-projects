import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from vectorstore.chroma_store import ingest_documents
from agents.support_agent import run_agent
from memory.conversation_memory import clear_memory
import tempfile
import os

app = FastAPI(
    title="Enterprise Customer Support Agent",
    description="LangGraph-powered support agent with RAG, memory, sentiment detection and escalation",
    version="1.0.0",
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/session/new", response_model=SessionResponse)
def new_session():
    return {"session_id": str(uuid.uuid4())}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        result = run_agent(
            session_id=request.session_id,
            user_message=request.message,
        )
        return ChatResponse(
            session_id=request.session_id,
            response=result["response"],
            sentiment=result["sentiment"],
            escalated=result["escalated"],
            case_id=result.get("case_id"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/session/{session_id}")
def end_session(session_id: str):
    clear_memory(session_id)
    return {"message": "Session cleared"}


@app.post("/knowledge-base/upload")
async def upload_knowledge_base(file: UploadFile = File(...)):
    allowed = {".pdf", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        if ext == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path)

        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        chunks = splitter.split_documents(documents)
        ingest_documents(chunks)

        return {"message": f"Ingested {len(chunks)} chunks from {file.filename}"}
    finally:
        os.unlink(tmp_path)
