import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    bot_id = Column(Uuid, ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    type = Column(Text, nullable=False)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=False)
    metadata_json = Column("metadata", Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bot = relationship("Bot")
