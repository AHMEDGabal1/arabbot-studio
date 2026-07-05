import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Workspace
from src.schemas import KnowledgeItemCreate, KnowledgeItemRead
from src.services import bot_service, knowledge_service

router = APIRouter(prefix="/bots/{bot_id}/knowledge", tags=["knowledge"])


async def _verify_bot_ownership(bot_id: uuid.UUID, workspace: Workspace, db: AsyncSession):
    bot = await bot_service.get_bot(db, str(bot_id), str(workspace.id))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.get("", response_model=list[KnowledgeItemRead])
async def list_knowledge(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(bot_id, workspace, db)
    items = await knowledge_service.get_items(db, str(bot_id))
    return [KnowledgeItemRead.model_validate(item) for item in items]


@router.post("", response_model=KnowledgeItemRead, status_code=status.HTTP_201_CREATED)
async def create_knowledge(
    bot_id: uuid.UUID,
    body: KnowledgeItemCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(bot_id, workspace, db)
    item = await knowledge_service.create_item(db, str(bot_id), body.model_dump())
    return KnowledgeItemRead.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge(
    bot_id: uuid.UUID,
    item_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(bot_id, workspace, db)
    deleted = await knowledge_service.delete_item(db, str(item_id), str(bot_id))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge item not found")


@router.post("/reindex", status_code=status.HTTP_200_OK)
async def reindex_knowledge(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(bot_id, workspace, db)
    await knowledge_service.reindex(db, str(bot_id))
    return {"status": "ok"}
