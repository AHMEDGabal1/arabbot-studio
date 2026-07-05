import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    plan = Column(String(20), default="starter")
    monthly_message_limit = Column(Integer, default=1000)
    messages_used_this_month = Column(Integer, default=0)
    last_message_month = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    members = relationship("WorkspaceMember", back_populates="workspace")
    bots = relationship("Bot", back_populates="workspace")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    workspace_id = Column(Uuid, ForeignKey("workspaces.id"), primary_key=True)
    user_id = Column(Uuid, ForeignKey("users.id"), primary_key=True)
    role = Column(String(20), default="member")

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspaces")
