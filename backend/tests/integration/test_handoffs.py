import pytest


@pytest.mark.asyncio
async def test_handoff_flow(client):
    await client.post("/api/v1/auth/register", json={
        "email": "handoffuser@example.com",
        "password": "testpass123",
        "name": "Handoff User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "handoffuser@example.com",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    resp = await client.get("/api/v1/handoffs")
    assert resp.status_code == 200
    assert resp.json()["items"] == []
