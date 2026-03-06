"""Pricing schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class PriceSnapshotResponse(BaseModel):
    price: Decimal
    currency: str
    market_price: Decimal | None
    lowest_listing: Decimal | None
    snapshot_at: datetime
    source_slug: str

    class Config:
        from_attributes = True


class PriceHistoryResponse(BaseModel):
    card_variant_id: UUID
    source_slug: str
    prices: list[dict]  # [{price, snapshot_at}]
    current: PriceSnapshotResponse | None
