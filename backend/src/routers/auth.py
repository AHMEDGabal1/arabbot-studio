from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db
from src.deps import get_current_user
from src.models import User, Workspace, WorkspaceMember
from src.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from src.services.rate_limiter import rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


def _create_token(user_id: str, workspace_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "workspace_id": workspace_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(rate_limit(5, 60)),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        phone=body.phone,
        password_hash=bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode(),
    )
    db.add(user)
    await db.flush()

    workspace = Workspace(name=f"{body.name}'s Workspace")
    db.add(workspace)
    await db.flush()

    membership = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
    db.add(membership)
    await db.flush()

    token = _create_token(str(user.id), str(workspace.id))
    return TokenResponse(access_token=token, workspace_id=str(workspace.id), user_id=str(user.id))


@router.post("/login")
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(rate_limit(5, 60)),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.user_id == user.id).limit(1)
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No workspace found")

    token = _create_token(str(user.id), str(membership.workspace_id))
    return TokenResponse(access_token=token, workspace_id=str(membership.workspace_id), user_id=str(user.id))


@router.post("/refresh")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(body.refresh_token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        workspace_id = payload.get("workspace_id")
        if not user_id or not workspace_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_token = _create_token(user_id, workspace_id)
    return TokenResponse(access_token=new_token, workspace_id=workspace_id, user_id=user_id)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
