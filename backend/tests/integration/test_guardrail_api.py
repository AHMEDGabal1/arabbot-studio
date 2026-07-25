import pytest


@pytest.fixture
async def auth_client(client):
    await client.post("/api/v1/auth/register", json={
        "email": "guardrail_user@example.com",
        "password": "testpass123",
        "name": "Guardrail User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "guardrail_user@example.com",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture
async def sample_bot(auth_client):
    resp = await auth_client.post("/api/v1/bots", json={
        "name": "Guardrail Bot",
        "channel": "whatsapp",
    })
    return resp.json()


@pytest.mark.asyncio
async def test_create_guardrail_rule(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    resp = await auth_client.post(f"/api/v1/bots/{bot_id}/guardrails", json={
        "rule_type": "forbidden_word",
        "value": "secret",
        "action": "block",
        "priority": 10,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["rule_type"] == "forbidden_word"
    assert data["value"] == "secret"
    assert data["action"] == "block"
    assert data["priority"] == 10
    assert data["bot_id"] == bot_id


@pytest.mark.asyncio
async def test_list_guardrail_rules(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    await auth_client.post(f"/api/v1/bots/{bot_id}/guardrails", json={
        "rule_type": "forbidden_word",
        "value": "word1",
    })
    await auth_client.post(f"/api/v1/bots/{bot_id}/guardrails", json={
        "rule_type": "max_length",
        "value": "100",
    })
    resp = await auth_client.get(f"/api/v1/bots/{bot_id}/guardrails")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_update_guardrail_rule(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    create_resp = await auth_client.post(f"/api/v1/bots/{bot_id}/guardrails", json={
        "rule_type": "forbidden_word",
        "value": "word1",
        "action": "block",
    })
    rule_id = create_resp.json()["id"]

    update_resp = await auth_client.patch(f"/api/v1/bots/{bot_id}/guardrails/{rule_id}", json={
        "action": "replace",
        "replacement_text": "CENSORED",
    })
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["action"] == "replace"
    assert data["replacement_text"] == "CENSORED"


@pytest.mark.asyncio
async def test_delete_guardrail_rule(auth_client, sample_bot):
    bot_id = sample_bot["id"]
    create_resp = await auth_client.post(f"/api/v1/bots/{bot_id}/guardrails", json={
        "rule_type": "forbidden_word",
        "value": "word1",
    })
    rule_id = create_resp.json()["id"]

    delete_resp = await auth_client.delete(f"/api/v1/bots/{bot_id}/guardrails/{rule_id}")
    assert delete_resp.status_code == 204

    list_resp = await auth_client.get(f"/api/v1/bots/{bot_id}/guardrails")
    assert list_resp.json()["total"] == 0
