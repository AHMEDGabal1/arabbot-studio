import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Uuid, ForeignKey("workspaces.id"), nullable=False, index=True)
    channel = Column(String(20), nullable=False)
    channel_user_id = Column(Text, nullable=False)
    display_name = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    # JSON array string: '["vip","returning"]'
    tags = Column(Text, nullable=True)
    # Free-text notes from human agents
    notes = Column(Text, nullable=True)
    first_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    total_conversations = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    preferred_language = Column(String(10), nullable=True)
    # JSON object string for arbitrary business data
    custom_fields = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    workspace = relationship("Workspace")

    __table_args__ = (
        UniqueConstraint("workspace_id", "channel", "channel_user_id", name="uq_customer_channel"),
    )
