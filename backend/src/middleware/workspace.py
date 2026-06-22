from fastapi import Request
from jose import JWTError, jwt

from src.config import settings


async def workspace_middleware(request: Request, call_next):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
            workspace_id = payload.get("workspace_id")
            if workspace_id:
                request.state.workspace_id = workspace_id
        except JWTError:
            pass
    response = await call_next(request)
    return response
