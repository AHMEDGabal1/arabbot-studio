import pytest
import uuid
from src.services.agent_routing_service import (
    get_agent_for_intent,
    seed_default_agents,
)


@pytest.mark.asyncio
async def test_seed_default_agents(db_session):
    bot_id = str(uuid.uuid4())
    agents = await seed_default_agents(db_session, bot_id)
    assert len(agents) == 4
    types = {a.agent_type for a in agents}
    assert types == {"sales", "support", "faq", "complaints"}


@pytest.mark.asyncio
async def test_get_agent_for_intent_match(db_session):
    bot_id = str(uuid.uuid4())
    await seed_default_agents(db_session, bot_id)

    sales_agent = await get_agent_for_intent(db_session, bot_id, "PRODUCT_INQUIRY")
    assert sales_agent is not None
    assert sales_agent.agent_type == "sales"

    support_agent = await get_agent_for_intent(db_session, bot_id, "HUMAN_REQUEST")
    assert support_agent is not None
    assert support_agent.agent_type == "support"


@pytest.mark.asyncio
async def test_get_agent_for_intent_no_match(db_session):
    bot_id = str(uuid.uuid4())
    await seed_default_agents(db_session, bot_id)

    unmatched = await get_agent_for_intent(db_session, bot_id, "UNKNOWN_INTENT_XYZ")
    assert unmatched is None
