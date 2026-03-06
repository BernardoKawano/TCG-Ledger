"""Celery tasks for price updates, alerts, exports."""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from src.workers.celery_app import celery_app
from src.core.database import SessionLocal
from src.models.pricing import PriceSnapshot, PriceSource
from src.models.alerts import AlertRule, AlertEvent
from src.models.export import ExportJob
from src.exports.service import ExportService


@celery_app.task
def update_prices_from_source(source_slug: str):
    """Fetch and store prices from a price source (TCGplayer, LigaMagic, etc.)."""
    db: Session = SessionLocal()
    try:
        source = db.query(PriceSource).filter(PriceSource.slug == source_slug).first()
        if not source:
            return {"status": "skipped", "reason": f"Source {source_slug} not found"}

        # Placeholder: real integration would call TCGplayer/LigaMagic API here.
        # For now, log and return. Structure ready for fetcher implementation.
        # Example: fetcher = get_fetcher_for_source(source_slug)
        #          for variant_id, price in fetcher.fetch_prices():
        #              PriceSnapshot(card_variant_id=variant_id, price_source_id=source.id, price=price)
        return {"status": "ok", "source": source_slug, "message": "Fetcher not implemented"}
    finally:
        db.close()


@celery_app.task
def process_alert_detection():
    """Detect price changes and create alert events from alert rules."""
    db: Session = SessionLocal()
    try:
        rules = db.query(AlertRule).filter(AlertRule.enabled == True).all()
        created = 0

        for rule in rules:
            if rule.type_ != "card":
                continue
            config = rule.config or {}
            variant_ids = config.get("card_variant_ids") or config.get("card_ids") or []
            threshold_pct = float(config.get("threshold_pct", 5.0))

            for vid in variant_ids:
                try:
                    variant_uuid = UUID(vid) if isinstance(vid, str) else vid
                except (ValueError, TypeError):
                    continue

                # Get two most recent snapshots per source
                snapshots = (
                    db.query(PriceSnapshot)
                    .filter(PriceSnapshot.card_variant_id == variant_uuid)
                    .order_by(desc(PriceSnapshot.snapshot_at))
                    .limit(20)
                    .all()
                )

                if len(snapshots) < 2:
                    continue

                # Group by source, find price change
                by_source: dict[UUID, list[PriceSnapshot]] = {}
                for s in snapshots:
                    k = s.price_source_id
                    if k not in by_source:
                        by_source[k] = []
                    if len(by_source[k]) < 2:
                        by_source[k].append(s)

                for source_id, snaps in by_source.items():
                    if len(snaps) < 2:
                        continue
                    old_price = float(snaps[1].price)
                    new_price = float(snaps[0].price)
                    if old_price <= 0:
                        continue
                    change_pct = ((new_price - old_price) / old_price) * 100
                    if abs(change_pct) >= threshold_pct:
                        existing = (
                            db.query(AlertEvent)
                            .filter(
                                AlertEvent.user_id == rule.user_id,
                                AlertEvent.card_variant_id == variant_uuid,
                                AlertEvent.old_price == Decimal(str(old_price)),
                                AlertEvent.new_price == Decimal(str(new_price)),
                            )
                            .first()
                        )
                        if not existing:
                            event = AlertEvent(
                                user_id=rule.user_id,
                                alert_rule_id=rule.id,
                                card_variant_id=variant_uuid,
                                old_price=Decimal(str(old_price)),
                                new_price=Decimal(str(new_price)),
                                change_pct=Decimal(str(round(change_pct, 2))),
                            )
                            db.add(event)
                            created += 1

        db.commit()
        return {"status": "ok", "events_created": created}
    finally:
        db.close()


@celery_app.task
def generate_export(export_id: str, user_id: str, format: str):
    """Generate collection export (JSON/CSV) asynchronously."""
    db: Session = SessionLocal()
    try:
        job = (
            db.query(ExportJob)
            .filter(
                ExportJob.id == UUID(export_id),
                ExportJob.user_id == UUID(user_id),
            )
            .first()
        )
        if not job:
            return {"status": "error", "reason": "Export job not found"}

        job.status = "processing"
        db.commit()

        try:
            content = (
                ExportService.generate_json(db, UUID(user_id))
                if format == "json"
                else ExportService.generate_csv(db, UUID(user_id))
            )
            job.status = "done"
            job.completed_at = datetime.utcnow()
            # file_url would be set when uploading to S3; for now leave null
            db.commit()
            return {"status": "ok", "export_id": export_id}
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)[:500]
            db.commit()
            raise
    finally:
        db.close()
