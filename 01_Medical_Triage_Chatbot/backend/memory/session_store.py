import json
import logging

import redis as redis_lib

from config import settings
from models.schemas import SessionSnapshot

logger = logging.getLogger(__name__)

_redis = redis_lib.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)

_KEY = "triage:{}"


def load(session_id: str) -> SessionSnapshot:
    try:
        raw = _redis.get(_KEY.format(session_id))
        if raw:
            return SessionSnapshot.model_validate(json.loads(raw))
    except Exception as e:
        logger.warning(f"Redis load failed for {session_id}: {e}")
    return SessionSnapshot()


def save(session_id: str, snap: SessionSnapshot) -> None:
    try:
        _redis.setex(
            _KEY.format(session_id),
            settings.session_ttl,
            snap.model_dump_json(),
        )
    except Exception as e:
        logger.warning(f"Redis save failed for {session_id}: {e}")


def delete(session_id: str) -> None:
    try:
        _redis.delete(_KEY.format(session_id))
    except Exception as e:
        logger.warning(f"Redis delete failed for {session_id}: {e}")