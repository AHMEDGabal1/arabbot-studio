import pytest
from src.services.customer_profile_service import get_or_create_profile


@pytest.fixture
async def auth_client(client):
    await client.post("/api/v1/auth/register", json={
        "email": "customer_user@example.com",
        "password": "Testpass123",
        "name": "Customer User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "customer_user@example.com",
        "password": "Testpass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    # Create a sample bot to get workspace_id
    bot_resp = await client.post("/api/v1/bots", json={
        "name": "Customer Bot",
        "channel": "whatsapp",
    })
    ws_id = bot_resp.json()["workspace_id"]
    return client, ws_id


@pytest.mark.asyncio
async def test_list_and_update_customers(auth_client, db_session):
    client, ws_id = auth_client
    profile = await get_or_create_profile(db_session, ws_id, "whatsapp", "+201111111111")
    await db_session.commit()

    resp = await client.get("/api/v1/customers")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1

    patch_resp = await client.patch(f"/api/v1/customers/{profile.id}", json={
        "display_name": "أحمد محمود",
        "notes": "عميل مميز",
    })
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["display_name"] == "أحمد محمود"
    assert updated["notes"] == "عميل مميز"
