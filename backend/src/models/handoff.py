import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class HandoffQueue(Base):
    __tablename__ = "handoff_queue"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(Uuid, ForeignKey("conversations.id"), nullable=False)
    reason = Column(Text, nullable=True)
    assigned_to = Column(Uuid, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="handoff")
