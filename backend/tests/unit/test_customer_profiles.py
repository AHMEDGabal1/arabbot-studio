import pytest
import uuid
from src.services.customer_profile_service import (
    get_or_create_profile,
    get_profile_context,
    increment_conversation_count,
    increment_message_count,
)


@pytest.mark.asyncio
async def test_get_or_create_profile(db_session):
    ws_id = str(uuid.uuid4())
    p1 = await get_or_create_profile(db_session, ws_id, "whatsapp", "+201012345678")
    assert p1 is not None
    assert p1.channel_user_id == "+201012345678"

    # Second call returns existing
    p2 = await get_or_create_profile(db_session, ws_id, "whatsapp", "+201012345678")
    assert p2.id == p1.id


@pytest.mark.asyncio
async def test_increment_counters_and_context(db_session):
    ws_id = str(uuid.uuid4())
    p = await get_or_create_profile(db_session, ws_id, "whatsapp", "+201099999999")

    # Initial context is empty (0 conversations)
    ctx0 = await get_profile_context(db_session, ws_id, "whatsapp", "+201099999999")
    assert ctx0 == ""

    await increment_conversation_count(db_session, p.id)
    await increment_message_count(db_session, p.id)

    ctx1 = await get_profile_context(db_session, ws_id, "whatsapp", "+201099999999")
    assert "عدد المحادثات: 1" in ctx1
    assert "عدد الرسائل: 1" in ctx1
