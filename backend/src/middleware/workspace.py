import logging
import uuid

from fastapi import Request
from jose import JWTError, jwt
from sqlalchemy import select

from src.config import settings
from src.database import async_session_factory
from src.models import User, WorkspaceMember
from src.services.supabase import get_supabase_admin

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
            supabase = get_supabase_admin()
            if supabase:
                try:
                    supabase_user = supabase.auth.get_user(token)
                    async with async_session_factory() as db:
                        result = await db.execute(
                            select(User).where(User.supabase_uid == supabase_user.user.id)
                        )
                        user = result.scalar_one_or_none()
                        if user:
                            result = await db.execute(
                                select(WorkspaceMember).where(WorkspaceMember.user_id == user.id).limit(1)
                            )
                            membership = result.scalar_one_or_none()
                            if membership:
                                request.state.workspace_id = str(membership.workspace_id)
                except Exception:
                    logger.warning("Supabase auth failed in workspace middleware")
    response = await call_next(request)
    return response
