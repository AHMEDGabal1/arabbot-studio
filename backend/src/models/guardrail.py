import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class GuardrailRule(Base):
    __tablename__ = "guardrail_rules"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id = Column(Uuid, ForeignKey("bots.id"), nullable=False, index=True)
    # Rule types: forbidden_word, max_discount, required_phrase, regex_block, max_length
    rule_type = Column(String(30), nullable=False)
    value = Column(Text, nullable=False)
    # Actions: block (reject response), replace (swap text), flag (log only), escalate (handoff)
    action = Column(String(20), default="block")
    replacement_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    # Higher priority rules are evaluated first
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bot = relationship("Bot")
