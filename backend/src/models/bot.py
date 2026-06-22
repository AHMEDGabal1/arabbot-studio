import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class Bot(Base):
    __tablename__ = "bots"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Uuid, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(100), nullable=False)
    language = Column(String(10), default="ar-EG")
    channel = Column(String(20), nullable=False)
    wa_phone_number_id = Column(Text, nullable=True)
    wa_access_token = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    fallback_message = Column(Text, default="هورينك لحد من فريقنا دلوقتي")
    human_handoff_enabled = Column(Boolean, default=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("Workspace", back_populates="bots")
