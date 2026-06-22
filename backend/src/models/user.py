import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text, Uuid
from sqlalchemy.orm import relationship

from src.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    workspaces = relationship("WorkspaceMember", back_populates="user")
