import pytest


@pytest.fixture
async def auth_client(client):
    await client.post("/api/v1/auth/register", json={
        "email": "botuser@example.com",
        "password": "testpass123",
        "name": "Bot User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "botuser@example.com",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.mark.asyncio
async def test_create_bot(auth_client):
    resp = await auth_client.post("/api/v1/bots", json={
        "name": "Test Bot",
        "channel": "whatsapp",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Bot"
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_list_bots(auth_client):
    await auth_client.post("/api/v1/bots", json={"name": "Bot 1", "channel": "whatsapp"})
    await auth_client.post("/api/v1/bots", json={"name": "Bot 2", "channel": "whatsapp"})
    resp = await auth_client.get("/api/v1/bots")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_bot(auth_client):
    create = await auth_client.post("/api/v1/bots", json={"name": "Get Bot", "channel": "whatsapp"})
    bot_id = create.json()["id"]
    resp = await auth_client.get(f"/api/v1/bots/{bot_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Get Bot"


@pytest.mark.asyncio
async def test_delete_bot(auth_client):
    create = await auth_client.post("/api/v1/bots", json={"name": "Delete Bot", "channel": "whatsapp"})
    bot_id = create.json()["id"]
    resp = await auth_client.delete(f"/api/v1/bots/{bot_id}")
    assert resp.status_code == 204
    resp = await auth_client.get(f"/api/v1/bots/{bot_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_activate_bot(auth_client):
    create = await auth_client.post("/api/v1/bots", json={"name": "Activate Bot", "channel": "whatsapp"})
    bot_id = create.json()["id"]
    resp = await auth_client.post(f"/api/v1/bots/{bot_id}/activate")
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True
