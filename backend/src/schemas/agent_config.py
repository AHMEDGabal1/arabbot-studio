import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AgentConfigCreate(BaseModel):
    agent_type: str
    display_name: str
    system_prompt: str
    handles_intents: str  # JSON array string
    model_provider: str = "gemini"
    model_name: str | None = None
    temperature: float = 0.7
    is_active: bool = True


class AgentConfigUpdate(BaseModel):
    agent_type: str | None = None
    display_name: str | None = None
    system_prompt: str | None = None
    handles_intents: str | None = None
    model_provider: str | None = None
    model_name: str | None = None
    temperature: float | None = None
    is_active: bool | None = None


class AgentConfigResponse(BaseModel):
    id: uuid.UUID
    bot_id: uuid.UUID
    agent_type: str
    display_name: str
    system_prompt: str
    model_provider: str
    model_name: str | None = None
    temperature: float
    handles_intents: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
