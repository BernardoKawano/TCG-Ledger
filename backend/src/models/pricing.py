"""Price sources and snapshots."""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.core.database import Base


class PriceSource(Base):
    """Price source (TCGplayer, LigaMagic, etc.)."""

    __tablename__ = "price_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    region = Column(String(10), nullable=False)  # US, BR
    type_ = Column("type", String(20), nullable=False)  # api, scraper
    config = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    snapshots = relationship("PriceSnapshot", back_populates="price_source")


class PriceSnapshot(Base):
    """Historical price snapshot for a card variant."""

    __tablename__ = "price_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_variant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("card_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    price_source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("price_sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    market_price = Column(Numeric(10, 2), nullable=True)
    lowest_listing = Column(Numeric(10, 2), nullable=True)
    snapshot_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    card_variant = relationship("CardVariant", backref="price_snapshots")
    price_source = relationship("PriceSource", back_populates="snapshots")

    __table_args__ = (
        Index("ix_price_snapshots_variant_source_time", "card_variant_id", "price_source_id", "snapshot_at"),
    )
