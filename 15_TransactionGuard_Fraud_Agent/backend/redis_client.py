"""Redis — two genuine jobs: (1) rate-limit the shared demo OpenAI key so cost stays
capped, (2) cache each account's transaction history so repeated checks against the
same account don't re-hit Postgres on every request."""
from __future__ import annotations

import json
import os
from typing import Optional

import redis.asyncio as redis

_client: Optional[redis.Redis] = None

DEMO_KEY_LIMIT = 5          # investigations per IP per hour on the shared demo key
DEMO_KEY_WINDOW_SECONDS = 3600
HISTORY_CACHE_TTL_SECONDS = 60
KEY_PREFIX = "tg:"  # namespaces every key — this Redis instance is shared across projects


async def init_client() -> Optional[redis.Redis]:
    global _client
    url = os.environ.get("REDIS_URL", "")
    if not url:
        return None
    _client = redis.from_url(url, decode_responses=True)
    await _client.ping()
    return _client


async def close_client() -> None:
    if _client is not None:
        await _client.close()


def get_client() -> Optional[redis.Redis]:
    return _client


async def check_demo_rate_limit(client_ip: str) -> tuple[bool, int]:
    """Returns (allowed, remaining). Fails open (allowed=True) if Redis isn't configured —
    a portfolio demo shouldn't hard-fail just because caching infra is optional."""
    if _client is None:
        return True, DEMO_KEY_LIMIT
    key = f"{KEY_PREFIX}demo_rl:{client_ip}"
    count = await _client.incr(key)
    if count == 1:
        await _client.expire(key, DEMO_KEY_WINDOW_SECONDS)
    remaining = max(0, DEMO_KEY_LIMIT - count)
    return count <= DEMO_KEY_LIMIT, remaining


async def get_cached_history(account_id: str) -> Optional[list[dict]]:
    if _client is None:
        return None
    raw = await _client.get(f"{KEY_PREFIX}history:{account_id}")
    return json.loads(raw) if raw else None


async def set_cached_history(account_id: str, history: list[dict]) -> None:
    if _client is None:
        return
    await _client.set(f"{KEY_PREFIX}history:{account_id}", json.dumps(history), ex=HISTORY_CACHE_TTL_SECONDS)


async def invalidate_history(account_id: str) -> None:
    if _client is None:
        return
    await _client.delete(f"{KEY_PREFIX}history:{account_id}")