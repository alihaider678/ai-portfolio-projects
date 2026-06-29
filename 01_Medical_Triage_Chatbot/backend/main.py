import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage

from agents.triage_graph import graph
from memory.session_store import delete, load, save
from models.schemas import ChatRequest, ChatResponse, SessionSnapshot

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger(__name__)

WELCOME_MESSAGE = (
    "Hello! I'm your AI medical triage assistant. I'll ask you a few questions "
    "about your symptoms to help determine the appropriate level of care you need. "
    "Please describe your main symptom or concern — what's bothering you today?"
)

DISCLAIMER = (
    "⚠️ This is an AI demonstration tool and is NOT a substitute for professional "
    "medical advice. Always consult a qualified healthcare professional or call "
    "emergency services (911) for medical emergencies."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from data.seed_medical_kb import seed_if_empty
        seed_if_empty()
    except Exception as e:
        logger.warning(f"Medical KB seed failed (non-fatal): {e}")
    yield


app = FastAPI(
    title="AI Medical Triage API",
    description="Multi-turn symptom interview with LangGraph + Claude + RAG",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/session/new")
def new_session():
    session_id = str(uuid.uuid4())
    return {
        "session_id": session_id,
        "welcome_message": WELCOME_MESSAGE,
        "disclaimer": DISCLAIMER,
    }


@app.delete("/session/{session_id}", status_code=204)
def clear_session(session_id: str):
    delete(session_id)


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    snap: SessionSnapshot = load(req.session_id)

    # Reconstruct LangChain messages from Redis snapshot
    lc_messages = []
    for msg in snap.messages:
        if msg["role"] == "human":
            lc_messages.append(HumanMessage(content=msg["content"]))
        else:
            lc_messages.append(AIMessage(content=msg["content"]))
    lc_messages.append(HumanMessage(content=req.message))

    initial_state = {
        "messages": lc_messages,
        "session_id": req.session_id,
        "api_key": req.api_key,
        "collected_symptoms": snap.collected_symptoms,
        "questions_asked": snap.questions_asked,
        "turn_count": snap.turn_count,
        "is_complete": snap.is_complete,
        "rag_context": "",
        "triage_level": snap.triage_level,
        "probable_conditions": snap.probable_conditions,
        "recommendations": snap.recommendations,
        "response_text": "",
        "response_type": "question",
    }

    try:
        # Run sync graph in thread pool to avoid blocking the event loop
        final_state = await asyncio.to_thread(graph.invoke, initial_state)
    except Exception as e:
        logger.error(f"Graph error for session {req.session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Persist updated snapshot to Redis
    snap.messages.append({"role": "human", "content": req.message})
    snap.messages.append({"role": "ai", "content": final_state.get("response_text", "")})
    snap.collected_symptoms = final_state.get("collected_symptoms", {})
    snap.questions_asked = final_state.get("questions_asked", [])
    snap.turn_count = final_state.get("turn_count", 0)
    snap.is_complete = final_state.get("is_complete", False)
    snap.triage_level = final_state.get("triage_level")
    snap.probable_conditions = final_state.get("probable_conditions", [])
    snap.recommendations = final_state.get("recommendations", [])
    save(req.session_id, snap)

    return ChatResponse(
        type=final_state.get("response_type", "question"),
        message=final_state.get("response_text", ""),
        triage_level=final_state.get("triage_level"),
        probable_conditions=final_state.get("probable_conditions", []),
        recommendations=final_state.get("recommendations", []),
        turn_count=final_state.get("turn_count", 0),
        collected_symptoms=final_state.get("collected_symptoms", {}),
    )