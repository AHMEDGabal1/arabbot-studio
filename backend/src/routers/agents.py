import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Bot, Workspace
from src.schemas.agent_config import AgentConfigCreate, AgentConfigResponse, AgentConfigUpdate
from src.services import agent_routing_service
from src.services.bot_service import get_bot

router = APIRouter(prefix="/bots", tags=["agents"])


async def _verify_bot_ownership(
    db: AsyncSession, bot_id: uuid.UUID, workspace_id: uuid.UUID
) -> Bot:
    """Verify bot exists and belongs to the current workspace."""
    bot = await get_bot(db, str(bot_id), str(workspace_id))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.get("/{bot_id}/agents", response_model=list[AgentConfigResponse])
async def list_agents(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    agents = await agent_routing_service.get_all_agents(db, str(bot_id))
    return agents


@router.post("/{bot_id}/agents/seed-defaults", response_model=list[AgentConfigResponse])
async def seed_defaults(
    bot_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Seed built-in specialist agent templates for this bot."""
    await _verify_bot_ownership(db, bot_id, workspace.id)
    agents = await agent_routing_service.seed_default_agents(db, str(bot_id))
    await db.commit()
    return agents


@router.post(
    "/{bot_id}/agents",
    response_model=AgentConfigResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent(
    bot_id: uuid.UUID,
    body: AgentConfigCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    agent = await agent_routing_service.create_agent(db, str(bot_id), body.model_dump())
    await db.commit()
    return agent


@router.patch("/{bot_id}/agents/{agent_id}", response_model=AgentConfigResponse)
async def update_agent(
    bot_id: uuid.UUID,
    agent_id: uuid.UUID,
    body: AgentConfigUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    agent = await agent_routing_service.update_agent(
        db, str(agent_id), str(bot_id), body.model_dump(exclude_unset=True)
    )
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent config not found"
        )
    await db.commit()
    return agent


@router.delete("/{bot_id}/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    bot_id: uuid.UUID,
    agent_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    deleted = await agent_routing_service.delete_agent(db, str(agent_id), str(bot_id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent config not found"
        )
    await db.commit()
