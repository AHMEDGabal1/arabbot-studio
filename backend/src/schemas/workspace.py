import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    plan: str
    monthly_message_limit: int
    messages_used_this_month: int
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceUpdate(BaseModel):
    plan: str | None = Field(default=None, min_length=1)
    monthly_message_limit: int | None = Field(default=None, ge=0)
