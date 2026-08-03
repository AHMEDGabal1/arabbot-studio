import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Conversation, HandoffQueue


async def _create_user_and_get_token(client, email: str, name: str) -> str:
    """Helper to register a new user with their own workspace and return access token."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Testpass123",
        "name": name,
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Testpass123",
    })
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_user_a_cannot_see_user_b_bots(client):
    """Verify User A in Workspace A cannot list or access bots created by User B in Workspace B."""
    token_a = await _create_user_and_get_token(client, "usera_bots@example.com", "User A")
    token_b = await _create_user_and_get_token(client, "userb_bots@example.com", "User B")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B creates a bot
    create_resp = await client.post("/api/v1/bots", json={
        "name": "User B Bot",
        "channel": "whatsapp",
    }, headers=headers_b)
    assert create_resp.status_code == 201

    # User B should see 1 bot
    list_b = await client.get("/api/v1/bots", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()["items"]) == 1

    # User A should see 0 bots
    list_a = await client.get("/api/v1/bots", headers=headers_a)
    assert list_a.status_code == 200
    assert len(list_a.json()["items"]) == 0


@pytest.mark.asyncio
async def test_user_a_cannot_see_user_b_conversations(client, db_session: AsyncSession):
    """Verify User A in Workspace A cannot view conversations belonging to User B's bots in Workspace B."""
    token_a = await _create_user_and_get_token(client, "usera_conv@example.com", "User A")
    token_b = await _create_user_and_get_token(client, "userb_conv@example.com", "User B")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B creates a bot
    bot_resp = await client.post("/api/v1/bots", json={
        "name": "User B Bot Conv",
        "channel": "whatsapp",
    }, headers=headers_b)
    assert bot_resp.status_code == 201
    bot_b_id = uuid.UUID(bot_resp.json()["id"])

    # Create a conversation for User B's bot in DB
    conv = Conversation(
        bot_id=bot_b_id,
        channel="whatsapp",
        channel_user_id="+201234567890",
    )
    db_session.add(conv)
    await db_session.commit()

    # User B lists conversations -> sees 1 conversation
    list_b = await client.get("/api/v1/conversations", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()["items"]) == 1

    # User A lists conversations -> sees 0 conversations
    list_a = await client.get("/api/v1/conversations", headers=headers_a)
    assert list_a.status_code == 200
    assert len(list_a.json()["items"]) == 0


@pytest.mark.asyncio
async def test_user_a_cannot_see_user_b_handoffs(client, db_session: AsyncSession):
    """Verify User A in Workspace A cannot view handoff requests from User B's workspace."""
    token_a = await _create_user_and_get_token(client, "usera_handoff@example.com", "User A")
    token_b = await _create_user_and_get_token(client, "userb_handoff@example.com", "User B")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B creates a bot
    bot_resp = await client.post("/api/v1/bots", json={
        "name": "User B Handoff Bot",
        "channel": "whatsapp",
    }, headers=headers_b)
    assert bot_resp.status_code == 201
    bot_b_id = uuid.UUID(bot_resp.json()["id"])

    # Create conversation and handoff for User B's bot in DB
    conv = Conversation(
        bot_id=bot_b_id,
        channel="whatsapp",
        channel_user_id="+201234567891",
    )
    db_session.add(conv)
    await db_session.flush()

    handoff = HandoffQueue(
        conversation_id=conv.id,
        reason="Intent: HUMAN_REQUEST",
    )
    db_session.add(handoff)
    await db_session.commit()

    # User B sees 1 handoff
    list_b = await client.get("/api/v1/handoffs", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()["items"]) == 1

    # User A sees 0 handoffs
    list_a = await client.get("/api/v1/handoffs", headers=headers_a)
    assert list_a.status_code == 200
    assert len(list_a.json()["items"]) == 0
