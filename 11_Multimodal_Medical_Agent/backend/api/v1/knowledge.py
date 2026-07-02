import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from agents import rag_agent
from services.vector_store import list_documents, get_chunk_count
from models.requests import RAGQueryRequest

router = APIRouter()

MAX_PDF_MB = 50


@router.post("/knowledge/ingest")
async def ingest_pdf(
    file: UploadFile = File(...),
    openai_api_key: str = Form(...),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_PDF_MB * 1024 * 1024:
        raise HTTPException(400, f"PDF too large. Max {MAX_PDF_MB}MB.")

    doc_name = file.filename.replace(".pdf", "")
    result = await rag_agent.ingest_pdf(pdf_bytes, doc_name, openai_api_key)
    return result


@router.post("/knowledge/query")
async def query_knowledge(body: RAGQueryRequest):
    # For query we need tts info — extend this via a separate body model
    # Defaults: openai TTS, no elevenlabs
    result = await rag_agent.query_knowledge_base(
        query=body.query,
        openai_api_key=body.openai_api_key,
        tts_provider="openai",
        elevenlabs_api_key=None,
        voice_id=None,
        top_k=body.top_k,
    )
    return result


@router.post("/knowledge/query/tts")
async def query_knowledge_with_tts(
    query: str = Form(...),
    openai_api_key: str = Form(...),
    tts_provider: str = Form("openai"),
    elevenlabs_api_key: str = Form(""),
    voice_id: str = Form(""),
    top_k: int = Form(3),
):
    if tts_provider == "elevenlabs" and not elevenlabs_api_key:
        raise HTTPException(400, "elevenlabs_api_key required when tts_provider='elevenlabs'")

    result = await rag_agent.query_knowledge_base(
        query=query,
        openai_api_key=openai_api_key,
        tts_provider=tts_provider,
        elevenlabs_api_key=elevenlabs_api_key or None,
        voice_id=voice_id or None,
        top_k=top_k,
    )
    return result


@router.get("/knowledge/docs")
async def list_docs(openai_api_key: str):
    docs = list_documents(openai_api_key)
    count = get_chunk_count(openai_api_key)
    return {"documents": docs, "total_chunks": count}