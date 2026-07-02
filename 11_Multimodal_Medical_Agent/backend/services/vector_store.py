from __future__ import annotations

import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from .pdf_parser import PDFSection, image_to_base64
from core.config import settings

COLLECTION_NAME = "medical_procedures"

_client = None
_collection = None


def _get_collection(openai_api_key: str):
    global _client, _collection
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_path)
    ef = OpenAIEmbeddingFunction(api_key=openai_api_key, model_name="text-embedding-3-small")
    _collection = _client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def add_sections(sections: list[PDFSection], doc_name: str, openai_api_key: str):
    """Ingest PDF sections (text + image b64) into ChromaDB."""
    col = _get_collection(openai_api_key)

    ids, documents, metadatas = [], [], []
    for s in sections:
        chunk_id = f"{doc_name}::page{s.page}::idx{s.section_index}"
        # Combine text + image descriptions for embedding
        embed_text = s.text
        if s.image_descriptions:
            embed_text += "\n\nImage context: " + " | ".join(s.image_descriptions)

        ids.append(chunk_id)
        documents.append(embed_text)
        metadatas.append({
            "doc_name": doc_name,
            "page": s.page,
            "text": s.text,
            # Store first image as b64 in metadata (ChromaDB metadata must be str/int/float)
            "image_b64": image_to_base64(s.images[0]) if s.images else "",
            "image_count": len(s.images),
            "image_descriptions": " | ".join(s.image_descriptions),
        })

    if ids:
        col.upsert(ids=ids, documents=documents, metadatas=metadatas)


def query_sections(query: str, openai_api_key: str, top_k: int = 3) -> list[dict]:
    """Retrieve top-k (text + image) pairs matching the query."""
    col = _get_collection(openai_api_key)
    results = col.query(query_texts=[query], n_results=min(top_k, col.count() or 1))

    hits = []
    for i, meta in enumerate(results["metadatas"][0]):
        hits.append({
            "doc_name": meta.get("doc_name", ""),
            "page": meta.get("page", 0),
            "text": meta.get("text", ""),
            "image_b64": meta.get("image_b64", ""),
            "image_descriptions": meta.get("image_descriptions", ""),
            "distance": results["distances"][0][i],
        })
    return hits


def list_documents(openai_api_key: str) -> list[str]:
    """Return unique document names in the knowledge base."""
    col = _get_collection(openai_api_key)
    if col.count() == 0:
        return []
    all_meta = col.get(include=["metadatas"])["metadatas"]
    return sorted(set(m.get("doc_name", "") for m in all_meta))


def get_chunk_count(openai_api_key: str) -> int:
    col = _get_collection(openai_api_key)
    return col.count()