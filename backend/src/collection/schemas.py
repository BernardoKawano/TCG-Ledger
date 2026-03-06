"""Collection schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CollectionItemCreate(BaseModel):
    card_variant_id: UUID
    quantity: int = 1
    condition: str | None = None
    language: str | None = None
    foil: str | None = None
    notes: str | None = None


class CollectionItemUpdate(BaseModel):
    quantity: int | None = None
    condition: str | None = None
    language: str | None = None
    foil: str | None = None
    notes: str | None = None


class CollectionItemResponse(BaseModel):
    id: UUID
    card_variant_id: UUID
    quantity: int
    condition: str | None
    language: str | None
    foil: str | None
    notes: str | None
    card_name: str | None = None
    set_name: str | None = None
    tcg_slug: str | None = None
    image_url: str | None = None
    current_price: Decimal | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CollectionListResponse(BaseModel):
    items: list[CollectionItemResponse]
    total: int
