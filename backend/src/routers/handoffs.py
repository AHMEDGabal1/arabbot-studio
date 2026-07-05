import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Workspace
from src.schemas import HandoffAssign, HandoffRead, HandoffResolve
from src.services import handoff_service

router = APIRouter(prefix="/handoffs", tags=["handoffs"])


@router.get("", response_model=list[HandoffRead])
async def list_handoffs(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    handoffs = await handoff_service.get_pending_handoffs(db, str(workspace.id))
    return [HandoffRead.model_validate(h) for h in handoffs]


@router.patch("/{handoff_id}/assign", response_model=HandoffRead)
async def assign_handoff(
    handoff_id: uuid.UUID,
    body: HandoffAssign,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    handoff = await handoff_service.assign_handoff(db, str(handoff_id), body.assigned_to)
    if not handoff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handoff not found")
    return HandoffRead.model_validate(handoff)


@router.patch("/{handoff_id}/resolve", response_model=HandoffRead)
async def resolve_handoff(
    handoff_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    handoff = await handoff_service.resolve_handoff(db, str(handoff_id))
    if not handoff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handoff not found")
    return HandoffRead.model_validate(handoff)
