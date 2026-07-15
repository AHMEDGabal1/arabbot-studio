import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import User, Workspace, WorkspaceMember
import uuid

@pytest.fixture
async def superadmin_user(db_session: AsyncSession):
    user = User(email="superadmin@test.com", password_hash="hash", supabase_uid="super_uid", is_superadmin=True)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.mark.asyncio
async def test_admin_analytics_forbidden_for_normal_user(client: AsyncClient, db_session: AsyncSession):
    user = User(email="normal@test.com", password_hash="hash", supabase_uid="normal_uid", is_superadmin=False)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    from jose import jwt
    from src.config import settings
    token = jwt.encode({"sub": str(user.id)}, settings.secret_key, algorithm=settings.jwt_algorithm)

    response = await client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_admin_analytics_allowed_for_superadmin(client: AsyncClient, db_session: AsyncSession, superadmin_user):
    from jose import jwt
    from src.config import settings
    token = jwt.encode({"sub": str(superadmin_user.id)}, settings.secret_key, algorithm=settings.jwt_algorithm)
    
    response = await client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data

