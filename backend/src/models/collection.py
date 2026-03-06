"""Collection and transactions."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.core.database import Base


class CollectionItem(Base):
    """User's collection item (card in collection)."""

    __tablename__ = "collection_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_variant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("card_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity = Column(Integer, default=1, nullable=False)
    condition = Column(String(20), nullable=True)  # NM, LP, MP, HP, DMG
    language = Column(String(10), nullable=True)
    foil = Column(String(20), nullable=True)  # foil, nonfoil, etc.
    acquired_at = Column(DateTime, nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="collection_items")
    card_variant = relationship("CardVariant", backref="collection_items")
    transactions = relationship("Transaction", back_populates="collection_item", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_collection_items_user_variant", "user_id", "card_variant_id"),)


class Transaction(Base):
    """Add/sell/trade transaction for collection."""

    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("collection_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    type_ = Column("type", String(20), nullable=False)  # add, sell, trade
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    collection_item = relationship("CollectionItem", back_populates="transactions")
