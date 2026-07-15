from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any, Dict
from uuid import UUID

from src.database import get_db
from src.deps import get_current_superadmin
from src.models import User, Workspace, Bot, Message, Conversation
from src.schemas.workspace import WorkspaceUpdate

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_superadmin)])

@router.get("/analytics")
async def get_platform_analytics(db: AsyncSession = Depends(get_db)):
    users_count = await db.scalar(select(func.count(User.id)))
    workspaces_count = await db.scalar(select(func.count(Workspace.id)))
    bots_count = await db.scalar(select(func.count(Bot.id)))
    active_bots_count = await db.scalar(select(func.count(Bot.id)).where(Bot.is_active == True))
    messages_count = await db.scalar(select(func.count(Message.id)))
    
    return {
        "total_users": users_count,
        "total_workspaces": workspaces_count,
        "total_bots": bots_count,
        "active_bots": active_bots_count,
        "total_messages": messages_count,
    }

@router.get("/workspaces")
async def list_workspaces(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).order_by(Workspace.created_at.desc()).limit(limit).offset(offset))
    workspaces = result.scalars().all()
    
    total = await db.scalar(select(func.count(Workspace.id)))
    
    return {
        "items": [
            {
                "id": w.id,
                "name": w.name,
                "plan": w.plan,
                "monthly_message_limit": w.monthly_message_limit,
                "messages_used_this_month": w.messages_used_this_month,
                "created_at": w.created_at,
            } for w in workspaces
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.patch("/workspaces/{workspace_id}")
async def update_workspace(workspace_id: UUID, payload: WorkspaceUpdate, db: AsyncSession = Depends(get_db)):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if payload.plan is not None:
        workspace.plan = payload.plan
    if payload.monthly_message_limit is not None:
        workspace.monthly_message_limit = payload.monthly_message_limit

    await db.commit()
    await db.refresh(workspace)
    return workspace

@router.get("/users")
async def list_users(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = result.scalars().all()
    total = await db.scalar(select(func.count(User.id)))
    return {
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "phone": u.phone,
                "is_superadmin": u.is_superadmin,
                "created_at": u.created_at,
            } for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }
