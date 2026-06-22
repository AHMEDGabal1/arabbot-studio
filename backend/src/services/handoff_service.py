import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Bot, Conversation, HandoffQueue


async def create_handoff(db: AsyncSession, conversation_id: str, reason: str | None = None) -> HandoffQueue:
    handoff = HandoffQueue(
        conversation_id=uuid.UUID(conversation_id),
        reason=reason,
    )
    db.add(handoff)
    await db.flush()
    await db.refresh(handoff)
    return handoff


async def get_pending_handoffs(db: AsyncSession, workspace_id: str) -> list[HandoffQueue]:
    result = await db.execute(
        select(HandoffQueue)
        .join(Conversation, HandoffQueue.conversation_id == Conversation.id)
        .join(Bot, Conversation.bot_id == Bot.id)
        .where(
            Bot.workspace_id == uuid.UUID(workspace_id),
            HandoffQueue.resolved_at.is_(None),
        )
        .order_by(HandoffQueue.created_at.asc())
    )
    return list(result.scalars().all())


async def assign_handoff(db: AsyncSession, handoff_id: str, agent_id: str) -> HandoffQueue | None:
    result = await db.execute(
        update(HandoffQueue)
        .where(HandoffQueue.id == uuid.UUID(handoff_id), HandoffQueue.resolved_at.is_(None))
        .values(assigned_to=uuid.UUID(agent_id))
        .returning(HandoffQueue)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def resolve_handoff(db: AsyncSession, handoff_id: str) -> HandoffQueue | None:
    result = await db.execute(
        update(HandoffQueue)
        .where(HandoffQueue.id == uuid.UUID(handoff_id), HandoffQueue.resolved_at.is_(None))
        .values(resolved_at=datetime.now(timezone.utc))
        .returning(HandoffQueue)
    )
    await db.flush()
    return result.scalar_one_or_none()
