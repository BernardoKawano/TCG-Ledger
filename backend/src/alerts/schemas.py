"""Alerts schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AlertRuleCreate(BaseModel):
    type: str  # card, portfolio, watchlist
    config: dict  # threshold_pct, card_ids, etc.


class AlertRuleResponse(BaseModel):
    id: UUID
    type: str
    config: dict
    enabled: bool

    class Config:
        from_attributes = True


class AlertEventResponse(BaseModel):
    id: UUID
    card_variant_id: UUID | None
    old_price: Decimal | None
    new_price: Decimal | None
    change_pct: Decimal | None
    created_at: datetime

    class Config:
        from_attributes = True
