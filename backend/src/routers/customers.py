import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Bot, Conversation, Workspace
from src.schemas.customer_profile import (
    CustomerProfileResponse,
    CustomerProfileSummary,
    CustomerProfileUpdate,
)
from src.services import customer_profile_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerProfileSummary])
async def list_customers(
    q: str | None = Query(None, description="Search by name, phone, or channel user ID"),
    tag: str | None = Query(None, description="Filter by tag"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    profiles = await customer_profile_service.search_profiles(
        db, str(workspace.id), query=q, tag=tag, limit=limit, offset=offset
    )
    return profiles


@router.get("/{profile_id}", response_model=CustomerProfileResponse)
async def get_customer(
    profile_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    profile = await customer_profile_service.get_profile_by_id(
        db, str(profile_id), str(workspace.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found"
        )
    return profile


@router.patch("/{profile_id}", response_model=CustomerProfileResponse)
async def update_customer(
    profile_id: uuid.UUID,
    body: CustomerProfileUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    profile = await customer_profile_service.update_profile(
        db, str(profile_id), str(workspace.id), body.model_dump(exclude_unset=True)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found"
        )
    await db.commit()
    return profile


@router.get("/{profile_id}/conversations", response_model=None)
async def list_customer_conversations(
    profile_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for a customer across all bots in the workspace."""
    profile = await customer_profile_service.get_profile_by_id(
        db, str(profile_id), str(workspace.id)
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found"
        )

    # Find conversations matching this customer's channel identity across workspace bots
    result = await db.execute(
        select(Conversation)
        .join(Bot, Conversation.bot_id == Bot.id)
        .where(
            Bot.workspace_id == workspace.id,
            Bot.deleted_at.is_(None),
            Conversation.channel == profile.channel,
            Conversation.channel_user_id == profile.channel_user_id,
        )
        .order_by(Conversation.last_message_at.desc())
    )
    return list(result.scalars().all())
