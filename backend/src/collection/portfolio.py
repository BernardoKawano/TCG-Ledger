"""Portfolio aggregation service."""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from src.models.collection import CollectionItem
from src.models.pricing import PriceSnapshot, PriceSource
from src.models.tcg import CardVariant, Card, CardSet, TCG


class PortfolioService:
    """Aggregate collection value and trends."""

    @staticmethod
    def get_portfolio_summary(db: Session, user_id: UUID) -> dict:
        """Compute total value, daily/weekly change, by_tcg, top gainers/losers."""
        # Get all collection items with their latest prices
        items = (
            db.query(CollectionItem)
            .filter(CollectionItem.user_id == user_id)
            .all()
        )
        total_value = Decimal("0")
        by_tcg: dict[str, dict] = {}
        item_values = []

        for item in items:
            latest = (
                db.query(PriceSnapshot)
                .filter(PriceSnapshot.card_variant_id == item.card_variant_id)
                .order_by(desc(PriceSnapshot.snapshot_at))
                .first()
            )
            if latest:
                val = latest.price * item.quantity
                total_value += val
                item_values.append((item, latest, val))
                # By TCG
                cv = db.get(CardVariant, item.card_variant_id)
                if cv and cv.card and cv.card.card_set:
                    tcg_slug = cv.card.card_set.tcg.slug if cv.card.card_set.tcg else "unknown"
                    if tcg_slug not in by_tcg:
                        by_tcg[tcg_slug] = {"value": Decimal("0"), "count": 0}
                    by_tcg[tcg_slug]["value"] += val
                    by_tcg[tcg_slug]["count"] += item.quantity

        # Daily change: compare to 24h ago
        day_ago = datetime.utcnow() - timedelta(days=1)
        prev_total = Decimal("0")
        for item, latest, _ in item_values:
            old = (
                db.query(PriceSnapshot)
                .filter(
                    PriceSnapshot.card_variant_id == item.card_variant_id,
                    PriceSnapshot.price_source_id == latest.price_source_id,
                    PriceSnapshot.snapshot_at <= day_ago,
                )
                .order_by(desc(PriceSnapshot.snapshot_at))
                .first()
            )
            if old:
                prev_total += old.price * item.quantity
        daily_change = total_value - prev_total if prev_total else Decimal("0")
        daily_pct = (daily_change / prev_total * 100) if prev_total else Decimal("0")

        # Weekly change: compare to 7d ago
        week_ago = datetime.utcnow() - timedelta(days=7)
        prev_week = Decimal("0")
        for item, latest, _ in item_values:
            old = (
                db.query(PriceSnapshot)
                .filter(
                    PriceSnapshot.card_variant_id == item.card_variant_id,
                    PriceSnapshot.price_source_id == latest.price_source_id,
                    PriceSnapshot.snapshot_at <= week_ago,
                )
                .order_by(desc(PriceSnapshot.snapshot_at))
                .first()
            )
            if old:
                prev_week += old.price * item.quantity
        weekly_change = total_value - prev_week if prev_week else Decimal("0")
        weekly_pct = (weekly_change / prev_week * 100) if prev_week else Decimal("0")

        # Top gainers/losers - simplified (would need more logic for proper gainers)
        top_gainers = []
        top_losers = []

        return {
            "total_value": float(total_value),
            "currency": "USD",
            "daily_change": {"amount": float(daily_change), "percent": float(daily_pct)},
            "weekly_change": {"amount": float(weekly_change), "percent": float(weekly_pct)},
            "by_tcg": [
                {"tcg_slug": k, "value": float(v["value"]), "count": v["count"]}
                for k, v in by_tcg.items()
            ],
            "top_gainers": top_gainers,
            "top_losers": top_losers,
        }
