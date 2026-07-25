import pytest


@pytest.fixture
async def auth_client(client):
    await client.post("/api/v1/auth/register", json={
        "email": "agent_user@example.com",
        "password": "testpass123",
        "name": "Agent User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "agent_user@example.com",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture
async def sample_bot(auth_client):
    resp = await auth_client.post("/api/v1/bots", json={
        "name": "Agent Bot",
        "channel": "whatsapp",
    })
    return resp.json()


@pytest.mark.asyncio
async def test_seed_defaults_api(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    resp = await auth_client.post(f"/api/v1/bots/{bot_id}/agents/seed-defaults")
    assert resp.status_code == 200
    agents = resp.json()
    assert len(agents) == 4

    list_resp = await auth_client.get(f"/api/v1/bots/{bot_id}/agents")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 4


@pytest.mark.asyncio
async def test_create_and_delete_agent(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    resp = await auth_client.post(f"/api/v1/bots/{bot_id}/agents", json={
        "agent_type": "custom",
        "display_name": "Custom Agent",
        "system_prompt": "Custom prompt",
        "handles_intents": '["CUSTOM_INTENT"]',
    })
    assert resp.status_code == 201
    agent = resp.json()
    agent_id = agent["id"]

    del_resp = await auth_client.delete(f"/api/v1/bots/{bot_id}/agents/{agent_id}")
    assert del_resp.status_code == 204
