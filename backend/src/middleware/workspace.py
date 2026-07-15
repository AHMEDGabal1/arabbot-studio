import logging

from fastapi import Request
from jose import JWTError, jwt
from sqlalchemy import select

from src.config import settings
from src.database import async_session_factory
from src.models import User, WorkspaceMember

logger = logging.getLogger(__name__)


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
            # ponytail: only JWT carries workspace_id; no secondary auth path
            logger.debug("Workspace middleware: invalid JWT, leaving workspace_id unset")
    response = await call_next(request)
    return response
