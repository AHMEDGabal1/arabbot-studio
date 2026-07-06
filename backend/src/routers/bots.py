import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_user, get_current_workspace
from src.models import User, Workspace
from src.schemas import BotCreate, BotRead, BotUpdate
from src.services import bot_service

router = APIRouter(prefix="/bots", tags=["bots"])


@router.get("")
async def list_bots(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    items, total = await bot_service.list_bots(db, str(workspace.id), limit, offset)
    return {"items": [BotRead.model_validate(b) for b in items], "total": total, "limit": limit, "offset": offset}


@router.post("", response_model=BotRead, status_code=status.HTTP_201_CREATED)
async def create_bot(
    body: BotCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await bot_service.create_bot(db, str(workspace.id), body.model_dump())


@router.get("/{bot_id}", response_model=BotRead)
async def get_bot(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    bot = await bot_service.get_bot(db, str(bot_id), str(workspace.id))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.patch("/{bot_id}", response_model=BotRead)
async def update_bot(
    bot_id: uuid.UUID,
    body: BotUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    bot = await bot_service.update_bot(db, str(bot_id), str(workspace.id), body.model_dump(exclude_unset=True))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bot(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    deleted = await bot_service.delete_bot(db, str(bot_id), str(workspace.id))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")


@router.post("/{bot_id}/activate", response_model=BotRead)
async def activate_bot(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    bot = await bot_service.update_bot(db, str(bot_id), str(workspace.id), {"is_active": True})
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.post("/{bot_id}/deactivate", response_model=BotRead)
async def deactivate_bot(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    bot = await bot_service.update_bot(db, str(bot_id), str(workspace.id), {"is_active": False})
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot
