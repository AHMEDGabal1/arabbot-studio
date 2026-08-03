import pytest


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Testpass123",
        "name": "Test User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "password": "Testpass123",
        "name": "Login User",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "Testpass123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_me(client):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "Testpass123",
        "name": "Me User",
    })
    token = reg.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_me_unauthorized(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_email(client):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "password": "Testpass123",
        "name": "Dup User",
    })
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "password": "Testpass123",
        "name": "Dup User 2",
    })
    assert resp.status_code == 409
