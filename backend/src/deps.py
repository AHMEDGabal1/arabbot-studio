import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import logging

from src.config import settings
from src.database import get_db
from src.models import User, Workspace, WorkspaceMember
from src.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    supabase = get_supabase_admin()

    # Try Supabase JWT first
    if supabase:
        try:
            supabase_user = supabase.auth.get_user(token)
            supabase_uid = supabase_user.user.id
            result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
            user = result.scalar_one_or_none()
            if user is None:
                result = await db.execute(select(User).where(User.email == supabase_user.user.email))
                user = result.scalar_one_or_none()
            if user is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            return user
        except Exception:
            logger.warning("Supabase auth failed, falling back to legacy JWT", exc_info=True)

    # fallback: legacy JWT for dev / migration period
    try:
        from jose import JWTError, jwt
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_workspace(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .options(selectinload(WorkspaceMember.workspace))
        .limit(1)
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No workspace found")
    return membership.workspace
