import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id = Column(Uuid, ForeignKey("bots.id", ondelete="CASCADE"), nullable=False, index=True)
    # Agent specialization: sales, support, faq, complaints, default
    agent_type = Column(String(30), nullable=False)
    display_name = Column(String(100), nullable=False)
    system_prompt = Column(Text, nullable=False)
    # Future-proofing: allow switching LLM providers per agent
    model_provider = Column(String(20), default="gemini")
    model_name = Column(String(50), nullable=True)
    temperature = Column(Float, default=0.7)
    # JSON array of intent strings this agent handles, e.g. '["PRODUCT_INQUIRY","PRICE_REQUEST"]'
    handles_intents = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bot = relationship("Bot")
