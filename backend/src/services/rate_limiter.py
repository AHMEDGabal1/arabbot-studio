import math
import os
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from src.config import settings

_store: dict[str, list[float]] = defaultdict(list)

try:
    import redis.asyncio as aioredis

    _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
except Exception:
    _redis = None


async def _check_redis(key: str, max_requests: int, window_seconds: int) -> bool:
    if _redis is None:
        return False
    try:
        await _redis.ping()
        pipe = _redis.pipeline()
        now = math.ceil(time.time())
        window_start = now - window_seconds
        await pipe.zremrangebyscore(key, 0, window_start)
        await pipe.zadd(key, {str(now): now})
        await pipe.expire(key, window_seconds)
        await pipe.zcard(key)
        results = await pipe.execute()
        return results[3] > max_requests
    except Exception:
        return False


def rate_limit(max_requests: int = 10, window_seconds: int = 60, key_prefix: str = ""):
    async def _check(request: Request):
        if settings.environment == "test":
            return
        client_host = request.client.host if request.client else "unknown"
        key = f"rl:{key_prefix}{client_host}:{request.url.path}"
        if await _check_redis(key, max_requests, window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, try again later",
            )
        now = time.time()
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
