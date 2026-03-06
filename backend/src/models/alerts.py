"""Alert rules and events."""
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from src.core.database import Base


class AlertRule(Base):
    """User's alert rule (card, portfolio, watchlist)."""

    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type_ = Column("type", String(20), nullable=False)  # card, portfolio, watchlist
    config = Column(JSONB, nullable=False)  # threshold_pct, card_ids, etc.
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="alert_rules")
    events = relationship("AlertEvent", back_populates="alert_rule", cascade="all, delete-orphan")


class AlertEvent(Base):
    """Alert event (price change detected)."""

    __tablename__ = "alert_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_rule_id = Column(
        UUID(as_uuid=True),
        ForeignKey("alert_rules.id", ondelete="CASCADE"),
        nullable=True,
    )
    card_variant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("card_variants.id", ondelete="SET NULL"),
        nullable=True,
    )
    old_price = Column(Decimal(10, 2), nullable=True)
    new_price = Column(Decimal(10, 2), nullable=True)
    change_pct = Column(Decimal(5, 2), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="alert_events")
    alert_rule = relationship("AlertRule", back_populates="events")
    card_variant = relationship("CardVariant", backref="alert_events")
