import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CustomerProfileResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    channel: str
    channel_user_id: str
    display_name: str | None = None
    phone: str | None = None
    email: str | None = None
    tags: str | None = None
    notes: str | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    total_conversations: int
    total_messages: int
    preferred_language: str | None = None
    custom_fields: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerProfileUpdate(BaseModel):
    display_name: str | None = None
    phone: str | None = None
    email: str | None = None
    tags: str | None = None
    notes: str | None = None
    preferred_language: str | None = None
    custom_fields: str | None = None


class CustomerProfileSummary(BaseModel):
    id: uuid.UUID
    display_name: str | None = None
    channel: str
    channel_user_id: str
    tags: str | None = None
    total_conversations: int
    total_messages: int
    last_seen_at: datetime

    model_config = ConfigDict(from_attributes=True)
