"""Pricing API routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.pricing.service import PricingService
from src.pricing.schemas import PriceSnapshotResponse, PriceHistoryResponse

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("", response_model=list[PriceSnapshotResponse])
def get_prices(
    card_variant_id: UUID = Query(...),
    source: str | None = Query(None, alias="source"),
    db: Session = Depends(get_db),
):
    """Get current prices for a card variant from configured sources."""
    snapshots = PricingService.get_latest_prices(db, card_variant_id, source_slug=source)
    return [
        PriceSnapshotResponse(
            price=s.price,
            currency=s.currency,
            market_price=s.market_price,
            lowest_listing=s.lowest_listing,
            snapshot_at=s.snapshot_at,
            source_slug=s.price_source.slug,
        )
        for s in snapshots
    ]


@router.get("/history", response_model=PriceHistoryResponse)
def get_price_history(
    card_variant_id: UUID = Query(...),
    source: str = Query(...),
    days: int = Query(30, le=365),
    db: Session = Depends(get_db),
):
    """Get price history for charts."""
    snapshots = PricingService.get_price_history(db, card_variant_id, source, days=days)
    current = snapshots[-1] if snapshots else None
    current_resp = None
    if current:
        current_resp = PriceSnapshotResponse(
            price=current.price,
            currency=current.currency,
            market_price=current.market_price,
            lowest_listing=current.lowest_listing,
            snapshot_at=current.snapshot_at,
            source_slug=current.price_source.slug,
        )
    return PriceHistoryResponse(
        card_variant_id=card_variant_id,
        source_slug=source,
        prices=[{"price": float(s.price), "snapshot_at": s.snapshot_at.isoformat()} for s in snapshots],
        current=current_resp,
    )
