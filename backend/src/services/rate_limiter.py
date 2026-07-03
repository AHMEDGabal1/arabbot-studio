import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from src.config import settings

_store: dict[str, list[float]] = defaultdict(list)


def rate_limit(max_requests: int = 10, window_seconds: int = 60, key_prefix: str = ""):
    async def _check(request: Request):
        if settings.environment == "test":
            return
        client_host = request.client.host if request.client else "unknown"
        key = f"{key_prefix}{client_host}:{request.url.path}"
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
