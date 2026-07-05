import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Bot, Conversation, Message, Workspace

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def analytics_overview(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    bots_result = await db.execute(
        select(func.count(Bot.id)).where(
            Bot.workspace_id == workspace.id,
            Bot.deleted_at.is_(None),
        )
    )
    total_bots = bots_result.scalar() or 0

    active_bots_result = await db.execute(
        select(func.count(Bot.id)).where(
            Bot.workspace_id == workspace.id,
            Bot.is_active.is_(True),
            Bot.deleted_at.is_(None),
        )
    )
    active_bots = active_bots_result.scalar() or 0

    conv_result = await db.execute(
        select(func.count(Conversation.id)).join(Bot).where(
            Bot.workspace_id == workspace.id,
            Conversation.deleted_at.is_(None),
        )
    )
    total_conversations = conv_result.scalar() or 0

    return {
        "total_bots": total_bots,
        "active_bots": active_bots,
        "total_conversations": total_conversations,
        "messages_this_month": workspace.messages_used_this_month,
        "messages_limit": workspace.monthly_message_limit,
        "intent_breakdown": {},
        "avg_response_time_ms": 0,
    }


@router.get("/bots/{bot_id}")
async def bot_analytics(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Bot).where(
            Bot.id == bot_id,
            Bot.workspace_id == workspace.id,
            Bot.deleted_at.is_(None),
        )
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")

    conv_result = await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.bot_id == bot_id,
            Conversation.deleted_at.is_(None),
        )
    )
    total_conversations = conv_result.scalar() or 0

    msg_result = await db.execute(
        select(func.count(Message.id)).join(Conversation).where(
            Conversation.bot_id == bot_id,
        )
    )
    total_messages = msg_result.scalar() or 0

    return {
        "bot_id": str(bot_id),
        "bot_name": bot.name,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
    }
