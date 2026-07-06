import uuid
from datetime import datetime

from pydantic import BaseModel


class HandoffRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    reason: str | None
    assigned_to: uuid.UUID | None
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class HandoffAssign(BaseModel):
    assigned_to: str


class HandoffList(BaseModel):
    items: list[HandoffRead]
    total: int
    limit: int
    offset: int


