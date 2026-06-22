import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id = Column(Uuid, ForeignKey("bots.id"), nullable=False)
    channel = Column(String(20), nullable=False)
    channel_user_id = Column(Text, nullable=False)
    user_display_name = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    bot = relationship("Bot")
    messages = relationship("Message", back_populates="conversation")
    handoff = relationship("HandoffQueue", back_populates="conversation", uselist=False)
