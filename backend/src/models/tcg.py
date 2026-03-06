"""TCG, CardSet, Card, CardVariant, VariantAttribute models."""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.core.database import Base


class TCG(Base):
    """Trading Card Game (Magic, Pokémon, etc.)."""

    __tablename__ = "tcgs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    supported_regions = Column(JSONB, default=["US", "BR"])  # list of region codes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    card_sets = relationship("CardSet", back_populates="tcg", cascade="all, delete-orphan")


class CardSet(Base):
    """Card set within a TCG (e.g. Dominaria, Base Set)."""

    __tablename__ = "card_sets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tcg_id = Column(UUID(as_uuid=True), ForeignKey("tcgs.id", ondelete="CASCADE"), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    release_date = Column(Date, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tcg = relationship("TCG", back_populates="card_sets")
    cards = relationship("Card", back_populates="card_set", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_card_sets_tcg_slug", "tcg_id", "slug", unique=True),)


class Card(Base):
    """Base card (unique per set)."""

    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_set_id = Column(UUID(as_uuid=True), ForeignKey("card_sets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(300), nullable=False, index=True)
    number = Column(String(20), nullable=True)  # collector number
    rarity = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=True)  # extra TCG-specific fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    card_set = relationship("CardSet", back_populates="cards")
    variants = relationship("CardVariant", back_populates="card", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_cards_set_number", "card_set_id", "number"),)


class CardVariant(Base):
    """Variant of a card (foil, non-foil, language, etc.)."""

    __tablename__ = "card_variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=False)  # e.g. "foil", "nonfoil", "foil-pt"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    card = relationship("Card", back_populates="variants")
    variant_attributes = relationship("VariantAttribute", back_populates="card_variant", cascade="all, delete-orphan")


class VariantAttribute(Base):
    """Flexible key-value attributes per variant (foil, language, condition)."""

    __tablename__ = "variant_attributes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_variant_id = Column(
        UUID(as_uuid=True), ForeignKey("card_variants.id", ondelete="CASCADE"), nullable=False
    )
    key = Column(String(50), nullable=False)
    value = Column(Text, nullable=True)

    card_variant = relationship("CardVariant", back_populates="variant_attributes")
