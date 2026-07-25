import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.chains.agent_prompts import DEFAULT_AGENT_TEMPLATES
from src.models.agent_config import AgentConfig

logger = logging.getLogger(__name__)


async def get_agent_for_intent(
    db: AsyncSession, bot_id: str, intent: str
) -> AgentConfig | None:
    """Find the specialist agent configured to handle the given intent.

    Iterates through active agents for this bot and checks if the intent
    exists in their handles_intents JSON array. Returns first match or None.
    """
    result = await db.execute(
        select(AgentConfig)
        .where(
            AgentConfig.bot_id == uuid.UUID(bot_id),
            AgentConfig.is_active.is_(True),
        )
        .order_by(AgentConfig.created_at.asc())
    )
    agents = result.scalars().all()

    for agent in agents:
        try:
            intents = json.loads(agent.handles_intents)
            if intent in intents:
                return agent
        except (json.JSONDecodeError, TypeError):
            logger.warning("Invalid handles_intents JSON for agent %s", agent.id)
            continue

    return None


async def get_all_agents(db: AsyncSession, bot_id: str) -> list[AgentConfig]:
    result = await db.execute(
        select(AgentConfig)
        .where(AgentConfig.bot_id == uuid.UUID(bot_id))
        .order_by(AgentConfig.created_at.asc())
    )
    return list(result.scalars().all())


async def seed_default_agents(db: AsyncSession, bot_id: str) -> list[AgentConfig]:
    """Seed built-in specialist agents from templates.

    Skips any agent_type that already exists for this bot to avoid duplicates.
    """
    existing = await get_all_agents(db, bot_id)
    existing_types = {a.agent_type for a in existing}

    created = []
    for template in DEFAULT_AGENT_TEMPLATES.values():
        if template["agent_type"] in existing_types:
            continue
        agent = AgentConfig(
            bot_id=uuid.UUID(bot_id),
            agent_type=template["agent_type"],
            display_name=template["display_name"],
            system_prompt=template["system_prompt"],
            handles_intents=template["handles_intents"],
            temperature=template["temperature"],
        )
        db.add(agent)
        created.append(agent)

    if created:
        await db.flush()
        for agent in created:
            await db.refresh(agent)

    return created


# --- CRUD helpers ---

async def create_agent(db: AsyncSession, bot_id: str, data: dict) -> AgentConfig:
    agent = AgentConfig(bot_id=uuid.UUID(bot_id), **data)
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return agent


async def get_agent_by_id(
    db: AsyncSession, agent_id: str, bot_id: str
) -> AgentConfig | None:
    result = await db.execute(
        select(AgentConfig).where(
            AgentConfig.id == uuid.UUID(agent_id),
            AgentConfig.bot_id == uuid.UUID(bot_id),
        )
    )
    return result.scalar_one_or_none()


async def update_agent(
    db: AsyncSession, agent_id: str, bot_id: str, data: dict
) -> AgentConfig | None:
    agent = await get_agent_by_id(db, agent_id, bot_id)
    if not agent:
        return None
    for key, value in data.items():
        setattr(agent, key, value)
    await db.flush()
    await db.refresh(agent)
    return agent


async def delete_agent(db: AsyncSession, agent_id: str, bot_id: str) -> bool:
    agent = await get_agent_by_id(db, agent_id, bot_id)
    if not agent:
        return False
    await db.delete(agent)
    await db.flush()
    return True
