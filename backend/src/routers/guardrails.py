import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.deps import get_current_workspace
from src.models import Bot, Workspace
from src.schemas.guardrail import (
    GuardrailRuleCreate,
    GuardrailRuleList,
    GuardrailRuleResponse,
    GuardrailRuleUpdate,
)
from src.services import guardrail_service
from src.services.bot_service import get_bot

router = APIRouter(prefix="/bots", tags=["guardrails"])


async def _verify_bot_ownership(
    db: AsyncSession, bot_id: uuid.UUID, workspace_id: uuid.UUID
) -> Bot:
    """Verify bot exists and belongs to the current workspace."""
    bot = await get_bot(db, str(bot_id), str(workspace_id))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.get("/{bot_id}/guardrails", response_model=GuardrailRuleList)
async def list_guardrail_rules(
    bot_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    items, total = await guardrail_service.list_guardrail_rules(db, str(bot_id), limit, offset)
    return GuardrailRuleList(
        items=[GuardrailRuleResponse.model_validate(r) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{bot_id}/guardrails",
    response_model=GuardrailRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_guardrail_rule(
    bot_id: uuid.UUID,
    body: GuardrailRuleCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    rule = await guardrail_service.create_guardrail_rule(db, str(bot_id), body.model_dump())
    await db.commit()
    return rule


@router.patch("/{bot_id}/guardrails/{rule_id}", response_model=GuardrailRuleResponse)
async def update_guardrail_rule(
    bot_id: uuid.UUID,
    rule_id: uuid.UUID,
    body: GuardrailRuleUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    rule = await guardrail_service.update_guardrail_rule(
        db, str(rule_id), str(bot_id), body.model_dump(exclude_unset=True)
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Guardrail rule not found"
        )
    await db.commit()
    return rule


@router.delete("/{bot_id}/guardrails/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guardrail_rule(
    bot_id: uuid.UUID,
    rule_id: uuid.UUID,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await _verify_bot_ownership(db, bot_id, workspace.id)
    deleted = await guardrail_service.delete_guardrail_rule(db, str(rule_id), str(bot_id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Guardrail rule not found"
        )
    await db.commit()
