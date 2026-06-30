import time

from .config import settings
from .redis_client import get_redis


async def check_rate_limit(ip: str) -> tuple[bool, int]:
    """
    Sliding-window rate limiter using a Redis sorted set.
    Returns (allowed, retry_after_seconds).

    Pattern: each request is stored as a member scored by its timestamp.
    Old entries outside the window are pruned on every check.
    This gives a true sliding window, not a fixed-bucket approximation.
    """
    redis = await get_redis()
    now = time.time()
    window_start = now - settings.rate_limit_window
    key = f"ratelimit:{ip}"

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)      # prune old entries
    pipe.zcard(key)                                   # count remaining
    pipe.zadd(key, {str(now): now})                  # add this request
    pipe.expire(key, settings.rate_limit_window)     # auto-clean the key
    results = await pipe.execute()

    count_before = results[1]

    if count_before >= settings.rate_limit_requests:
        # Find the oldest entry to tell the caller how long to wait
        oldest = await redis.zrange(key, 0, 0, withscores=True)
        retry_after = int(settings.rate_limit_window - (now - oldest[0][1])) if oldest else settings.rate_limit_window
        return False, max(1, retry_after)

    return True, 0