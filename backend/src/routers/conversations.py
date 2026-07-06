import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Bot, Conversation, Workspace
from src.schemas import ConversationList, ConversationRead, MessageRead
from src.services import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=ConversationList)
async def list_conversations(
    bot_id: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    items, total = await conversation_service.list_conversations(
        db, str(workspace.id), bot_id, status, limit, offset,
    )
    return ConversationList(
        items=[ConversationRead.model_validate(c) for c in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{conv_id}", response_model=ConversationRead)
async def get_conversation(
    conv_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).join(Bot).where(
            Conversation.id == conv_id,
            Bot.workspace_id == workspace.id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


@router.get("/{conv_id}/messages")
async def get_messages(
    conv_id: uuid.UUID,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).join(Bot).where(
            Conversation.id == conv_id,
            Bot.workspace_id == workspace.id,
            Conversation.deleted_at.is_(None),
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    items, total = await conversation_service.get_conversation_messages(db, str(conv_id), limit, offset)
    return {"items": [MessageRead.model_validate(m) for m in items], "total": total, "limit": limit, "offset": offset}
