import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Bot


async def create_bot(db: AsyncSession, workspace_id: str, data: dict) -> Bot:
    bot = Bot(workspace_id=uuid.UUID(workspace_id), **data)
    db.add(bot)
    await db.flush()
    await db.refresh(bot)
    return bot


async def get_bot(db: AsyncSession, bot_id: str, workspace_id: str) -> Bot | None:
    result = await db.execute(
        select(Bot).where(
            Bot.id == uuid.UUID(bot_id),
            Bot.workspace_id == uuid.UUID(workspace_id),
            Bot.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def list_bots(db: AsyncSession, workspace_id: str, limit: int = 50, offset: int = 0) -> tuple[list[Bot], int]:
    result = await db.execute(
        select(Bot)
        .where(Bot.workspace_id == uuid.UUID(workspace_id), Bot.deleted_at.is_(None))
        .order_by(Bot.created_at.desc())
        .offset(offset).limit(limit)
    )
    items = list(result.scalars().all())
    count_result = await db.execute(
        select(func.count(Bot.id)).where(Bot.workspace_id == uuid.UUID(workspace_id), Bot.deleted_at.is_(None))
    )
    return items, count_result.scalar() or 0


async def update_bot(db: AsyncSession, bot_id: str, workspace_id: str, data: dict) -> Bot | None:
    data["updated_at"] = datetime.now(timezone.utc)
    result = await db.execute(
        update(Bot)
        .where(Bot.id == uuid.UUID(bot_id), Bot.workspace_id == uuid.UUID(workspace_id), Bot.deleted_at.is_(None))
        .values(**data)
        .returning(Bot)
    )
    await db.flush()
    return result.scalar_one_or_none()


async def delete_bot(db: AsyncSession, bot_id: str, workspace_id: str) -> bool:
    result = await db.execute(
        update(Bot)
        .where(Bot.id == uuid.UUID(bot_id), Bot.workspace_id == uuid.UUID(workspace_id), Bot.deleted_at.is_(None))
        .values(deleted_at=datetime.now(timezone.utc))
    )
    await db.flush()
    return result.rowcount > 0
