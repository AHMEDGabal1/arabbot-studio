import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(Uuid, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    raw_content = Column(Text, nullable=True)
    intent_detected = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    processing_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")
