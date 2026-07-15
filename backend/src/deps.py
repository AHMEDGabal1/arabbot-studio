import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import logging

from src.config import settings
from src.database import get_db
from src.models import User, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    # ponytail: JWT is the single auth source. Supabase (if configured) is used only
    # for optional file storage, never for authentication, to avoid two competing auth paths.
    token = credentials.credentials
    try:
        from jose import JWTError, jwt
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        # IMPORTANT: uuid.UUID() must be inside the try/except — a malformed
        # "sub" claim would otherwise crash with an unhandled ValueError.
        parsed_user_id = uuid.UUID(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == parsed_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_workspace(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    # IMPORTANT: The JWT middleware sets request.state.workspace_id. When present,
    # we verify the user is a member of that specific workspace instead of blindly
    # returning the first one — this is what enforces multi-workspace isolation.
    workspace_id = getattr(request.state, "workspace_id", None)

    if workspace_id:
        try:
            ws_uuid = uuid.UUID(workspace_id)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid workspace")

        result = await db.execute(
            select(WorkspaceMember)
            .where(
                WorkspaceMember.user_id == user.id,
                WorkspaceMember.workspace_id == ws_uuid,
            )
            .options(selectinload(WorkspaceMember.workspace))
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this workspace")
        return membership.workspace

    # Fallback: no workspace_id in request state — return the user's first workspace.
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


async def get_current_superadmin(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_superadmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required")
    return user
