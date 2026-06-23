import json
import redis as redis_lib
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from utils.config import settings

_redis = redis_lib.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)

SESSION_TTL = 86400  # 24 hours
MAX_MESSAGES = 20    # 10 turns


def _msg_key(session_id: str) -> str:
    return f"session:{session_id}:messages"


def _neg_key(session_id: str) -> str:
    return f"session:{session_id}:negative_count"


def _serialize(msg: BaseMessage) -> dict:
    return {"type": msg.type, "content": msg.content}


def _deserialize(d: dict) -> BaseMessage:
    return HumanMessage(content=d["content"]) if d["type"] == "human" else AIMessage(content=d["content"])


def get_chat_history(session_id: str) -> list[BaseMessage]:
    raw = _redis.get(_msg_key(session_id))
    if not raw:
        return []
    return [_deserialize(m) for m in json.loads(raw)[-MAX_MESSAGES:]]


def add_messages(session_id: str, human: str, ai: str) -> None:
    history = get_chat_history(session_id)
    history.extend([HumanMessage(content=human), AIMessage(content=ai)])
    serialized = [_serialize(m) for m in history[-MAX_MESSAGES:]]
    _redis.setex(_msg_key(session_id), SESSION_TTL, json.dumps(serialized))


def get_negative_count(session_id: str) -> int:
    raw = _redis.get(_neg_key(session_id))
    return int(raw) if raw else 0


def increment_negative_count(session_id: str) -> int:
    count = _redis.incr(_neg_key(session_id))
    _redis.expire(_neg_key(session_id), SESSION_TTL)
    return count


def clear_memory(session_id: str) -> None:
    _redis.delete(_msg_key(session_id), _neg_key(session_id))
