"""Catalog Pydantic schemas."""
from datetime import date
from uuid import UUID

from pydantic import BaseModel


class TCGResponse(BaseModel):
    id: UUID
    slug: str
    name: str

    class Config:
        from_attributes = True


class CardSetResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    release_date: date | None

    class Config:
        from_attributes = True


class CardVariantSummary(BaseModel):
    id: UUID
    sku: str

    class Config:
        from_attributes = True


class CardResponse(BaseModel):
    id: UUID
    name: str
    number: str | None
    rarity: str | None
    image_url: str | None
    card_set: CardSetResponse | None = None
    tcg: TCGResponse | None = None
    variants: list[CardVariantSummary] = []

    class Config:
        from_attributes = True


class CardSearchResult(BaseModel):
    cards: list[CardResponse]
    total: int
