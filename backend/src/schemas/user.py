import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    phone: str | None
    is_superadmin: bool
    created_at: datetime

    model_config = {"from_attributes": True}
