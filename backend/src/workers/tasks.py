"""Celery tasks for price updates, alerts, exports."""
from src.workers.celery_app import celery_app


@celery_app.task
def update_prices_from_source(source_slug: str):
    """Fetch and store prices from a price source (TCGplayer, LigaMagic, etc.)."""
    # Placeholder - implement per-source fetcher
    pass


@celery_app.task
def process_alert_detection():
    """Detect price changes and create alert events."""
    pass


@celery_app.task
def generate_export(export_id: str, user_id: str, format: str):
    """Generate collection export (JSON/CSV)."""
    pass
