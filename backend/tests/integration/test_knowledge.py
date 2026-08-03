import pytest


@pytest.fixture
async def auth_bot(client):
    await client.post("/api/v1/auth/register", json={
        "email": "knowuser@example.com",
        "password": "Testpass123",
        "name": "Knowledge User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "knowuser@example.com",
        "password": "Testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    create = await client.post("/api/v1/bots", json={"name": "Know Bot", "channel": "whatsapp"})
    return client, create.json()["id"]


@pytest.mark.asyncio
async def test_create_knowledge(auth_bot):
    client, bot_id = auth_bot
    resp = await client.post(f"/api/v1/bots/{bot_id}/knowledge", json={
        "type": "faq",
        "question": "What are your hours?",
        "answer": "We are open 10 AM to 11 PM daily",
    })
    assert resp.status_code == 201
    assert resp.json()["type"] == "faq"


@pytest.mark.asyncio
async def test_list_knowledge(auth_bot):
    client, bot_id = auth_bot
    await client.post(f"/api/v1/bots/{bot_id}/knowledge", json={
        "type": "faq",
        "question": "Q1",
        "answer": "A1",
    })
    resp = await client.get(f"/api/v1/bots/{bot_id}/knowledge")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


@pytest.mark.asyncio
async def test_delete_knowledge(auth_bot):
    client, bot_id = auth_bot
    create = await client.post(f"/api/v1/bots/{bot_id}/knowledge", json={
        "type": "faq",
        "question": "Q2",
        "answer": "A2",
    })
    item_id = create.json()["id"]
    resp = await client.delete(f"/api/v1/bots/{bot_id}/knowledge/{item_id}")
    assert resp.status_code == 204
