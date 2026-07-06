import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class BotCreate(BaseModel):
    name: str
    channel: str = "whatsapp"
    language: str = "ar-EG"
    system_prompt: str | None = None
    fallback_message: str | None = None
    wa_phone_number_id: str | None = None
    wa_access_token: str | None = None
    wa_verify_token: str | None = None

    @field_validator("wa_access_token", "wa_verify_token")
    @classmethod
    def token_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Token cannot be empty or whitespace")
        return v


class BotUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    language: str | None = None
    system_prompt: str | None = None
    fallback_message: str | None = None
    wa_phone_number_id: str | None = None
    wa_access_token: str | None = None
    wa_verify_token: str | None = None
    human_handoff_enabled: bool | None = None

    @field_validator("wa_access_token", "wa_verify_token")
    @classmethod
    def token_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Token cannot be empty or whitespace")
        return v


class BotRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    language: str
    channel: str
    system_prompt: str | None
    fallback_message: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BotList(BaseModel):
    items: list[BotRead]
    total: int
    limit: int
    offset: int


