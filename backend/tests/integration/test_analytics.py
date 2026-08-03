import uuid
import pytest


@pytest.fixture
async def auth_client(client):
    """
    Authenticate user and set Bearer token header for analytics integration tests.
    """
    await client.post("/api/v1/auth/register", json={
        "email": "analyticsuser@example.com",
        "password": "Testpass123",
        "name": "Analytics User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "analyticsuser@example.com",
        "password": "Testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.mark.asyncio
async def test_analytics_overview_unauthorized(client):
    """Verify GET /api/v1/analytics/overview requires authentication (401/403 without token)."""
    resp = await client.get("/api/v1/analytics/overview")
    assert resp.status_code in (401, 403)

    resp_invalid = await client.get("/api/v1/analytics/overview", headers={"Authorization": "Bearer invalid_token"})
    assert resp_invalid.status_code == 401


@pytest.mark.asyncio
async def test_bot_analytics_unauthorized(client):
    """Verify GET /api/v1/analytics/bots/{bot_id} requires authentication (401/403 without token)."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/analytics/bots/{fake_id}")
    assert resp.status_code in (401, 403)

    resp_invalid = await client.get(f"/api/v1/analytics/bots/{fake_id}", headers={"Authorization": "Bearer invalid_token"})
    assert resp_invalid.status_code == 401


@pytest.mark.asyncio
async def test_analytics_overview(auth_client):
    """Verify GET /api/v1/analytics/overview returns 200 and expected analytics fields."""
    # Create a bot to populate workspace data
    bot_resp = await auth_client.post("/api/v1/bots", json={
        "name": "Analytics Bot",
        "channel": "whatsapp",
    })
    assert bot_resp.status_code == 201

    resp = await auth_client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_conversations" in data
    assert "intent_breakdown" in data
    assert "total_bots" in data
    assert "active_bots" in data
    assert data["total_bots"] >= 1


@pytest.mark.asyncio
async def test_bot_analytics_valid_bot(auth_client):
    """Verify GET /api/v1/analytics/bots/{bot_id} returns 200 for a valid bot."""
    bot_resp = await auth_client.post("/api/v1/bots", json={
        "name": "Single Bot Analytics",
        "channel": "whatsapp",
    })
    assert bot_resp.status_code == 201
    bot_id = bot_resp.json()["id"]

    resp = await auth_client.get(f"/api/v1/analytics/bots/{bot_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["bot_id"] == bot_id
    assert data["bot_name"] == "Single Bot Analytics"
    assert "total_conversations" in data
    assert "total_messages" in data
