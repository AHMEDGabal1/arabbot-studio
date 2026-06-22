import uuid
from datetime import datetime

from pydantic import BaseModel


class ConversationRead(BaseModel):
    id: uuid.UUID
    bot_id: uuid.UUID
    channel: str
    channel_user_id: str
    user_display_name: str | None
    status: str
    started_at: datetime
    last_message_at: datetime | None

    model_config = {"from_attributes": True}


class ConversationList(BaseModel):
    items: list[ConversationRead]
    total: int
    limit: int
    offset: int


class MessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    raw_content: str | None
    intent_detected: str | None
    confidence: float | None
    was_rag_hit: bool
    processing_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
