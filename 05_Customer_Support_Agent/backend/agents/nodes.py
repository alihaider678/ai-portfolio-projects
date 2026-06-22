import uuid
from typing import Any
from langchain_core.messages import HumanMessage, AIMessage
from tools.sentiment import analyze_sentiment
from tools.escalation import should_escalate, get_escalation_response
from chains.rag_chain import get_rag_chain
from memory.conversation_memory import (
    get_chat_history,
    add_messages,
    get_negative_count,
    increment_negative_count,
)
from utils.config import settings


def retrieve_and_respond(state: dict[str, Any]) -> dict[str, Any]:
    session_id = state["session_id"]
    user_message = state["user_message"]
    api_key = state.get("api_key")

    chat_history = get_chat_history(session_id)
    chain, _ = get_rag_chain(api_key=api_key)
    response = chain.invoke({"question": user_message, "chat_history": chat_history})

    add_messages(session_id, user_message, response)

    return {**state, "response": response}


def sentiment_node(state: dict[str, Any]) -> dict[str, Any]:
    session_id = state["session_id"]
    sentiment = analyze_sentiment(state["user_message"], api_key=state.get("api_key"))

    negative_count = get_negative_count(session_id)
    if sentiment in ("negative", "frustrated"):
        negative_count = increment_negative_count(session_id)

    return {**state, "sentiment": sentiment, "negative_count": negative_count}


def escalation_check(state: dict[str, Any]) -> str:
    if should_escalate(
        state["sentiment"],
        state.get("negative_count", 0),
        settings.escalation_threshold,
    ):
        return "escalate"
    return "respond"


def escalate_node(state: dict[str, Any]) -> dict[str, Any]:
    case_id = str(uuid.uuid4())[:8].upper()

    try:
        from tasks.escalation_tasks import notify_escalation
        notify_escalation.delay(state["session_id"], case_id, state["user_message"])
    except Exception:
        pass

    response = get_escalation_response(case_id)
    return {**state, "response": response, "escalated": True, "case_id": case_id}