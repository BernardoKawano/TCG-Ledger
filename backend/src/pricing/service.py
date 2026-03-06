"""Pricing service."""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from src.models.pricing import PriceSnapshot, PriceSource


class PricingService:
    @staticmethod
    def get_latest_prices(
        db: Session,
        card_variant_id: UUID,
        source_slug: str | None = None,
    ) -> list[PriceSnapshot]:
        """Get latest price per source for a variant."""
        query = (
            db.query(PriceSnapshot)
            .join(PriceSource)
            .filter(PriceSnapshot.card_variant_id == card_variant_id)
        )
        if source_slug:
            query = query.filter(PriceSource.slug == source_slug)
        return query.order_by(desc(PriceSnapshot.snapshot_at)).limit(10).all()

    @staticmethod
    def get_price_history(
        db: Session,
        card_variant_id: UUID,
        source_slug: str,
        days: int = 30,
    ) -> list[PriceSnapshot]:
        """Get price history for chart."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        return (
            db.query(PriceSnapshot)
            .join(PriceSource)
            .filter(
                PriceSnapshot.card_variant_id == card_variant_id,
                PriceSource.slug == source_slug,
                PriceSnapshot.snapshot_at >= cutoff,
            )
            .order_by(PriceSnapshot.snapshot_at)
            .all()
        )
