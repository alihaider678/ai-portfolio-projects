"""
Capability 2 + 3 — PDF Ingestion & Multimodal RAG Agent

Capability 2: ingest_pdf → parse PDF → describe images → store (text + image) pairs in ChromaDB
Capability 3: query → retrieve (text + image) pairs → TTS the instruction
"""
import asyncio
from services import pdf_parser, vector_store, vision, tts
from core.logger import get_logger

logger = get_logger("rag_agent")


async def ingest_pdf(
    pdf_bytes: bytes,
    doc_name: str,
    openai_api_key: str,
) -> dict:
    """Parse PDF and ingest all (text + image) sections into ChromaDB."""
    logger.info("Parsing PDF", doc_name=doc_name)
    sections = pdf_parser.extract_sections(pdf_bytes)
    logger.info("Extracted sections", count=len(sections))

    # Describe embedded images using GPT-4o Vision (in parallel, max 5 concurrent)
    sem = asyncio.Semaphore(5)

    async def describe_section_images(section):
        async with sem:
            descriptions = []
            for img_bytes in section.images:
                try:
                    desc = await vision.describe_image(
                        img_bytes,
                        openai_api_key,
                        context=f"Page {section.page} of '{doc_name}'",
                    )
                    descriptions.append(desc)
                except Exception as e:
                    logger.warning("Image description failed", error=str(e))
                    descriptions.append("")
            section.image_descriptions = descriptions

    await asyncio.gather(*[describe_section_images(s) for s in sections])

    # Store in ChromaDB
    vector_store.add_sections(sections, doc_name, openai_api_key)

    return {
        "doc_name": doc_name,
        "pages_ingested": len(sections),
        "images_found": sum(len(s.images) for s in sections),
        "total_chunks": vector_store.get_chunk_count(openai_api_key),
    }


async def query_knowledge_base(
    query: str,
    openai_api_key: str,
    tts_provider: str,
    elevenlabs_api_key: str | None,
    voice_id: str | None,
    top_k: int = 3,
) -> dict:
    """Retrieve top-k (image + text) pairs and generate a spoken response."""
    logger.info("RAG query", query=query[:80])
    hits = vector_store.query_sections(query, openai_api_key, top_k)

    if not hits:
        spoken = "I could not find any relevant procedures in the knowledge base. Please ingest medical PDFs first."
        audio_b64 = _bytes_to_b64(await tts.synthesize(
            spoken, tts_provider, openai_api_key, elevenlabs_api_key, voice_id
        ))
        return {"query": query, "results": [], "spoken_response": spoken, "audio_b64": audio_b64}

    # Build spoken response from top result
    top = hits[0]
    spoken = _build_spoken_response(query, hits)
    audio_bytes = await tts.synthesize(
        spoken, tts_provider, openai_api_key, elevenlabs_api_key, voice_id
    )

    return {
        "query": query,
        "results": hits,
        "spoken_response": spoken,
        "audio_b64": _bytes_to_b64(audio_bytes),
    }


def _build_spoken_response(query: str, hits: list[dict]) -> str:
    top = hits[0]
    parts = [f"Here is what I found for: {query}."]
    parts.append(f"From '{top['doc_name']}', page {top['page']}:")
    if top.get("text"):
        # Limit to first 300 chars for TTS
        text = top["text"][:300].strip()
        parts.append(text)
    if top.get("image_descriptions"):
        parts.append(f"The accompanying diagram shows: {top['image_descriptions'][:200]}")
    if len(hits) > 1:
        parts.append(f"I found {len(hits)} related sections in total.")
    return " ".join(parts)


def _bytes_to_b64(b: bytes) -> str:
    import base64
    return base64.b64encode(b).decode("utf-8")