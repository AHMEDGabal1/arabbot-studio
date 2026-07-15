import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, update
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


async def get_pending_handoffs(db: AsyncSession, workspace_id: str, limit: int = 50, offset: int = 0) -> tuple[list[HandoffQueue], int]:
    base_where = (
        Bot.workspace_id == uuid.UUID(workspace_id),
        HandoffQueue.resolved_at.is_(None),
    )
    query = (
        select(HandoffQueue)
        .join(Conversation, HandoffQueue.conversation_id == Conversation.id)
        .join(Bot, Conversation.bot_id == Bot.id)
        .where(*base_where)
        .order_by(HandoffQueue.created_at.asc())
        .offset(offset).limit(limit)
    )
    result = await db.execute(query)
    items = list(result.scalars().all())
    count_result = await db.execute(
        select(func.count(HandoffQueue.id))
        .join(Conversation, HandoffQueue.conversation_id == Conversation.id)
        .join(Bot, Conversation.bot_id == Bot.id)
        .where(*base_where)
    )
    return items, count_result.scalar() or 0


async def assign_handoff(db: AsyncSession, handoff_id: str, agent_id: str, workspace_id: str) -> HandoffQueue | None:
    subq = select(Conversation.id).join(Bot).where(Bot.workspace_id == uuid.UUID(workspace_id))
    result = await db.execute(
        update(HandoffQueue)
        .where(
            HandoffQueue.id == uuid.UUID(handoff_id),
            HandoffQueue.resolved_at.is_(None),
            HandoffQueue.conversation_id.in_(subq),
        )
        .values(assigned_to=uuid.UUID(agent_id))
        .returning(HandoffQueue)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def resolve_handoff(db: AsyncSession, handoff_id: str, workspace_id: str) -> HandoffQueue | None:
    subq = select(Conversation.id).join(Bot).where(Bot.workspace_id == uuid.UUID(workspace_id))
    result = await db.execute(
        update(HandoffQueue)
        .where(
            HandoffQueue.id == uuid.UUID(handoff_id),
            HandoffQueue.resolved_at.is_(None),
            HandoffQueue.conversation_id.in_(subq),
        )
        .values(resolved_at=datetime.now(timezone.utc))
        .returning(HandoffQueue)
    )
    await db.flush()
    handoff = result.scalar_one_or_none()
    # IMPORTANT: Reactivate AI processing — without this, resolving a handoff
    # would leave the conversation permanently muted in "handed_off" status.
    if handoff:
        conv_result = await db.execute(
            select(Conversation).where(Conversation.id == handoff.conversation_id)
        )
        conversation = conv_result.scalar_one_or_none()
        if conversation:
            conversation.status = "active"
    return handoff
