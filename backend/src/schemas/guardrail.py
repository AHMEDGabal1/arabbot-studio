import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

ALLOWED_RULE_TYPES = {
    "forbidden_word",
    "max_discount",
    "required_phrase",
    "regex_block",
    "max_length",
}
ALLOWED_ACTIONS = {"block", "replace", "flag", "escalate"}


class GuardrailRuleCreate(BaseModel):
    rule_type: str
    value: str
    action: str = "block"
    replacement_text: str | None = None
    is_active: bool = True
    priority: int = 0

    @field_validator("rule_type")
    @classmethod
    def validate_rule_type(cls, v: str) -> str:
        if v not in ALLOWED_RULE_TYPES:
            raise ValueError(
                f"Invalid rule_type '{v}'. Allowed: {', '.join(sorted(ALLOWED_RULE_TYPES))}"
            )
        return v

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in ALLOWED_ACTIONS:
            raise ValueError(
                f"Invalid action '{v}'. Allowed: {', '.join(sorted(ALLOWED_ACTIONS))}"
            )
        return v


class GuardrailRuleUpdate(BaseModel):
    rule_type: str | None = None
    value: str | None = None
    action: str | None = None
    replacement_text: str | None = None
    is_active: bool | None = None
    priority: int | None = None

    @field_validator("rule_type")
    @classmethod
    def validate_rule_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_RULE_TYPES:
            raise ValueError(
                f"Invalid rule_type '{v}'. Allowed: {', '.join(sorted(ALLOWED_RULE_TYPES))}"
            )
        return v

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_ACTIONS:
            raise ValueError(
                f"Invalid action '{v}'. Allowed: {', '.join(sorted(ALLOWED_ACTIONS))}"
            )
        return v


class GuardrailRuleResponse(BaseModel):
    id: uuid.UUID
    bot_id: uuid.UUID
    rule_type: str
    value: str
    action: str
    replacement_text: str | None = None
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuardrailRuleList(BaseModel):
    items: list[GuardrailRuleResponse]
    total: int
    limit: int
    offset: int
