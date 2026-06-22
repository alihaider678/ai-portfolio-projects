import uuid
from typing import Any
from langchain_core.messages import HumanMessage, AIMessage
from tools.sentiment import analyze_sentiment
from tools.escalation import should_escalate, get_escalation_response
from chains.rag_chain import get_rag_chain
from memory.conversation_memory import get_memory
from utils.config import settings


def retrieve_and_respond(state: dict[str, Any]) -> dict[str, Any]:
    session_id = state["session_id"]
    user_message = state["user_message"]
    memory = get_memory(session_id)
    chat_history = memory.messages

    chain, _ = get_rag_chain()
    response = chain.invoke({
        "question": user_message,
        "chat_history": chat_history,
    })

    memory.add_message(HumanMessage(content=user_message))
    memory.add_message(AIMessage(content=response))

    return {**state, "response": response}


def sentiment_node(state: dict[str, Any]) -> dict[str, Any]:
    sentiment = analyze_sentiment(state["user_message"])
    negative_count = state.get("negative_count", 0)

    if sentiment in ("negative", "frustrated"):
        negative_count += 1

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
    response = get_escalation_response(case_id)
    return {**state, "response": response, "escalated": True, "case_id": case_id}
