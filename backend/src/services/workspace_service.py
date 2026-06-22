import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Workspace, WorkspaceMember


async def create_workspace(db: AsyncSession, name: str, user_id: str) -> Workspace:
    workspace = Workspace(name=name)
    db.add(workspace)
    await db.flush()

    membership = WorkspaceMember(workspace_id=workspace.id, user_id=uuid.UUID(user_id), role="owner")
    db.add(membership)
    await db.flush()

    return workspace


async def get_workspace_by_user(db: AsyncSession, user_id: str) -> Workspace | None:
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == uuid.UUID(user_id))
        .limit(1)
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        return None
    result = await db.execute(
        select(Workspace).where(Workspace.id == membership.workspace_id)
    )
    return result.scalar_one_or_none()
