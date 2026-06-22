import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Bot, Conversation, Message


async def get_or_create_conversation(
    db: AsyncSession,
    bot_id: str,
    channel: str,
    channel_user_id: str,
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.bot_id == uuid.UUID(bot_id),
            Conversation.channel_user_id == channel_user_id,
            Conversation.deleted_at.is_(None),
        ).order_by(Conversation.last_message_at.desc().nullsfirst()).limit(1)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        conversation = Conversation(
            bot_id=uuid.UUID(bot_id),
            channel=channel,
            channel_user_id=channel_user_id,
        )
        db.add(conversation)
        await db.flush()
    return conversation


async def add_message(db: AsyncSession, conversation_id: str, role: str, content: str, **kwargs) -> Message:
    msg = Message(
        conversation_id=uuid.UUID(conversation_id),
        role=role,
        content=content,
        **kwargs,
    )
    db.add(msg)
    await db.flush()

    conversation = await db.get(Conversation, uuid.UUID(conversation_id))
    if conversation:
        conversation.last_message_at = datetime.now(timezone.utc)

    return msg


async def list_conversations(
    db: AsyncSession,
    workspace_id: str,
    bot_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Conversation], int]:
    base_where = (
        Bot.workspace_id == uuid.UUID(workspace_id),
        Conversation.deleted_at.is_(None),
    )
    if bot_id:
        base_where += (Conversation.bot_id == uuid.UUID(bot_id),)
    if status:
        base_where += (Conversation.status == status,)

    query = select(Conversation).join(Bot).where(*base_where).order_by(
        Conversation.last_message_at.desc().nullslast()
    ).offset(offset).limit(limit)

    count_query = select(func.count(Conversation.id)).join(Bot).where(*base_where)

    result = await db.execute(query)
    items = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return items, total


async def get_conversation_messages(db: AsyncSession, conversation_id: str) -> list[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == uuid.UUID(conversation_id))
        .order_by(Message.created_at.asc())
    )
    return list(result.scalars().all())
