import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def auth_handoff(client, db_session: AsyncSession):
    """Register user, create bot, create conversation + handoff via service layer."""
    await client.post("/api/v1/auth/register", json={
        "email": "handoffuser@example.com",
        "password": "Testpass123",
        "name": "Handoff User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "handoffuser@example.com",
        "password": "Testpass123",
    })
    data = resp.json()
    token = data["access_token"]
    user_id = data["user_id"]
    client.headers["Authorization"] = f"Bearer {token}"

    # Create a bot
    bot_resp = await client.post("/api/v1/bots", json={
        "name": "Handoff Bot",
        "channel": "whatsapp",
    })
    bot_id = bot_resp.json()["id"]

    # Create a conversation + handoff directly in DB
    from src.models import Conversation, HandoffQueue
    conv = Conversation(
        bot_id=uuid.UUID(bot_id),
        channel="whatsapp",
        channel_user_id="+201234567890",
    )
    db_session.add(conv)
    await db_session.flush()

    handoff = HandoffQueue(
        conversation_id=conv.id,
        reason="Intent: HUMAN_REQUEST",
    )
    db_session.add(handoff)
    await db_session.flush()
    await db_session.commit()

    return client, str(handoff.id), user_id


@pytest.mark.asyncio
async def test_handoff_flow(client):
    """Test listing handoffs returns empty list for new user."""
    await client.post("/api/v1/auth/register", json={
        "email": "handoffuser@example.com",
        "password": "Testpass123",
        "name": "Handoff User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "handoffuser@example.com",
        "password": "Testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    resp = await client.get("/api/v1/handoffs")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


@pytest.mark.asyncio
async def test_list_pending_handoffs(auth_handoff):
    """Test listing pending handoffs returns the created handoff."""
    client, handoff_id, _ = auth_handoff
    resp = await client.get("/api/v1/handoffs")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == handoff_id
    assert data["items"][0]["reason"] == "Intent: HUMAN_REQUEST"
    assert data["items"][0]["resolved_at"] is None


@pytest.mark.asyncio
async def test_assign_handoff(auth_handoff):
    """Test assigning a handoff to an agent."""
    client, handoff_id, user_id = auth_handoff
    resp = await client.patch(
        f"/api/v1/handoffs/{handoff_id}/assign",
        json={"assigned_to": user_id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["assigned_to"] == user_id


@pytest.mark.asyncio
async def test_resolve_handoff(auth_handoff):
    """Test resolving a handoff."""
    client, handoff_id, _ = auth_handoff
    resp = await client.patch(f"/api/v1/handoffs/{handoff_id}/resolve")
    assert resp.status_code == 200
    data = resp.json()
    assert data["resolved_at"] is not None

    # Verify it no longer appears in pending list
    list_resp = await client.get("/api/v1/handoffs")
    assert list_resp.status_code == 200
    assert len(list_resp.json()["items"]) == 0


@pytest.mark.asyncio
async def test_assign_nonexistent_handoff(client):
    """Test assigning a handoff that doesn't exist returns 404."""
    await client.post("/api/v1/auth/register", json={
        "email": "handoff404@example.com",
        "password": "Testpass123",
        "name": "404 User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "handoff404@example.com",
        "password": "Testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"/api/v1/handoffs/{fake_id}/assign",
        json={"assigned_to": str(uuid.uuid4())},
    )
    assert resp.status_code == 404
