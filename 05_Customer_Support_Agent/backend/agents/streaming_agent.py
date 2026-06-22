import uuid
import asyncio
from typing import AsyncGenerator
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


async def stream_agent_response(session_id: str, user_message: str) -> AsyncGenerator[dict, None]:
    # 1. Sentiment analysis (sync LLM call — fast, temperature=0)
    sentiment = analyze_sentiment(user_message)

    # 2. Update persistent negative count in Redis
    negative_count = get_negative_count(session_id)
    if sentiment in ("negative", "frustrated"):
        negative_count = increment_negative_count(session_id)

    # 3. Escalation check
    if should_escalate(sentiment, negative_count, settings.escalation_threshold):
        case_id = str(uuid.uuid4())[:8].upper()

        # Fire-and-forget Celery notification task
        try:
            from tasks.escalation_tasks import notify_escalation
            notify_escalation.delay(session_id, case_id, user_message)
        except Exception:
            pass  # Celery unavailable — don't block the response

        # Stream escalation message word-by-word
        escalation_msg = get_escalation_response(case_id)
        words = escalation_msg.split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else " " + word
            yield {"type": "token", "token": token}
            await asyncio.sleep(0.04)

        yield {"type": "done", "escalated": True, "case_id": case_id, "sentiment": sentiment}

    else:
        # 4. Stream RAG chain response token by token
        chat_history = get_chat_history(session_id)
        chain, _ = get_rag_chain()
        full_response = ""

        async for chunk in chain.astream({"question": user_message, "chat_history": chat_history}):
            if chunk:
                full_response += chunk
                yield {"type": "token", "token": chunk}

        # Persist conversation to Redis
        add_messages(session_id, user_message, full_response)

        yield {"type": "done", "escalated": False, "case_id": None, "sentiment": sentiment}