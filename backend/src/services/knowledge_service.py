import json
import uuid

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import KnowledgeItem
from src.services.vector_store import add_to_index, build_index


async def create_item(db: AsyncSession, bot_id: str, data: dict) -> KnowledgeItem:
    item = KnowledgeItem(
        bot_id=uuid.UUID(bot_id),
        type=data["type"],
        question=data.get("question"),
        answer=data["answer"],
        metadata_json=json.dumps(data["item_metadata"]) if data.get("item_metadata") else None,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    text = f"{item.question or ''} {item.answer}"
    await add_to_index(bot_id, [text])

    return item


async def get_items(db: AsyncSession, bot_id: str, limit: int = 50, offset: int = 0) -> tuple[list[KnowledgeItem], int]:
    result = await db.execute(
        select(KnowledgeItem).where(KnowledgeItem.bot_id == uuid.UUID(bot_id)).order_by(KnowledgeItem.created_at.desc()).offset(offset).limit(limit)
    )
    items = list(result.scalars().all())
    count_result = await db.execute(
        select(func.count(KnowledgeItem.id)).where(KnowledgeItem.bot_id == uuid.UUID(bot_id))
    )
    return items, count_result.scalar() or 0


async def delete_item(db: AsyncSession, item_id: str, bot_id: str) -> bool:
    result = await db.execute(
        delete(KnowledgeItem).where(
            KnowledgeItem.id == uuid.UUID(item_id),
            KnowledgeItem.bot_id == uuid.UUID(bot_id),
        )
    )
    await db.flush()
    return result.rowcount > 0


async def reindex(db: AsyncSession, bot_id: str) -> None:
    items, _ = await get_items(db, bot_id)
    texts = [f"{item.question or ''} {item.answer}" for item in items]
    if texts:
        await build_index(bot_id, texts)


async def search_knowledge(bot_id: str, query: str, k: int = 3) -> list[dict]:
    from src.services.vector_store import search
    texts = await search(bot_id, query, k)
    return [{"content": t} for t in texts]
