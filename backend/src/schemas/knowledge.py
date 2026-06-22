import json
import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic.functional_validators import field_validator


class KnowledgeItemCreate(BaseModel):
    type: str = "faq"
    question: str | None = None
    answer: str
    item_metadata: dict | None = None


class KnowledgeItemRead(BaseModel):
    id: uuid.UUID
    bot_id: uuid.UUID
    type: str
    question: str | None
    answer: str
    item_metadata: dict | None = Field(default=None, validation_alias="metadata_json")
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("item_metadata", mode="before")
    @classmethod
    def _parse_metadata(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v
