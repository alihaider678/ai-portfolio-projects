"""
Retrieval node — queries the medical knowledge base (ChromaDB) with the
collected symptoms and returns the top relevant documents as context.
"""

import logging

from models.schemas import TriageState

logger = logging.getLogger(__name__)


def retrieval_node(state: TriageState) -> dict:
    from data.seed_medical_kb import get_collection

    symptoms = state["collected_symptoms"]

    # Build a natural-language query from collected symptom data
    parts = []
    if symptoms.get("main_symptom"):
        parts.append(str(symptoms["main_symptom"]))
    if symptoms.get("associated_symptoms"):
        parts.append(str(symptoms["associated_symptoms"]))
    if symptoms.get("severity"):
        parts.append(f"severity {symptoms['severity']} out of 10")
    if symptoms.get("duration"):
        parts.append(f"duration {symptoms['duration']}")
    if symptoms.get("medical_history"):
        parts.append(f"history of {symptoms['medical_history']}")

    query = " ".join(parts) if parts else "general symptom assessment"

    try:
        collection = get_collection()
        results = collection.query(query_texts=[query], n_results=4)
        docs = results.get("documents", [[]])[0]
        rag_context = "\n\n---\n\n".join(docs) if docs else ""
    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        rag_context = ""

    return {"rag_context": rag_context}