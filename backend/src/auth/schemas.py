"""Auth Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """User registration payload."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User in API responses."""

    id: UUID
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Data extracted from JWT."""

    user_id: str
    email: str | None = None
