import math
import time
import uuid
from collections import OrderedDict

from fastapi import HTTPException, Request, status

from src.config import settings

_store: OrderedDict[str, list[float]] = OrderedDict()
_MAX_KEYS = 10000

try:
    import redis.asyncio as aioredis

    _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
except Exception:
    _redis = None


async def _check_redis(key: str, max_requests: int, window_seconds: int) -> bool | None:
    """Returns True if over limit, False if under limit, None if Redis unavailable.

    IMPORTANT: Returning None (not False) for unavailable Redis tells the caller
    to fall back to local rate limiting. This prevents distributed rate limiting
    from being completely bypassed when Redis is down.
    """
    if _redis is None:
        return None
    try:
        pipe = _redis.pipeline()
        now = math.ceil(time.time())
        window_start = now - window_seconds
        # Clean expired entries
        await pipe.zremrangebyscore(key, 0, window_start)
        # Add current request timestamp
        await pipe.zadd(key, {f"{now}:{uuid.uuid4()}": now})
        # Set expiration to prevent memory leaks
        await pipe.expire(key, window_seconds + 60)
        # Count total requests in window
        await pipe.zcard(key)
        results = await pipe.execute()
        # Check if request count exceeds limit
        return results[3] > max_requests
    except Exception:
        # Redis unavailable - fall back to local rate limiting
        return None


def rate_limit(max_requests: int = 10, window_seconds: int = 60, key_prefix: str = ""):
    async def _check(request: Request):
        if settings.environment == "test":
            return
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_host = forwarded.split(",")[0].strip()
        else:
            client_host = request.client.host if request.client else "unknown"
        key = f"rl:{key_prefix}{client_host}:{request.url.path}"
        redis_result = await _check_redis(key, max_requests, window_seconds)
        if redis_result is True:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, try again later",
            )
        # Only use the local in-memory fallback when Redis is unavailable.
        if redis_result is None:
            now = time.time()
            if key not in _store:
                if len(_store) >= _MAX_KEYS:
                    _store.popitem(last=False)
                _store[key] = []
            else:
                # IMPORTANT: Move to end on access so the eviction target is
                # always the *least recently used* key, not just the oldest.
                _store.move_to_end(key)
            timestamps = _store[key]
            while timestamps and timestamps[0] < now - window_seconds:
                timestamps.pop(0)
            if len(timestamps) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests, try again later",
                )
            timestamps.append(now)
    return _check
