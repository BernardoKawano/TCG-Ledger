"""Catalog search and retrieval service."""
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from src.models.tcg import TCG, CardSet, Card, CardVariant


class CatalogService:
    """Catalog queries."""

    @staticmethod
    def search_cards(
        db: Session,
        q: str | None = None,
        tcg_id: UUID | None = None,
        set_id: UUID | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Card], int]:
        """Search cards by name, optional filters."""
        query = (
            db.query(Card)
            .options(
                joinedload(Card.card_set).joinedload(CardSet.tcg),
                joinedload(Card.variants),
            )
        )
        if tcg_id:
            query = query.join(CardSet).filter(CardSet.tcg_id == tcg_id)
        if set_id:
            query = query.filter(Card.card_set_id == set_id)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(Card.name.ilike(term), Card.number.ilike(term)))
        total = query.count()
        cards = query.order_by(Card.name).offset(offset).limit(limit).all()
        return cards, total

    @staticmethod
    def get_card_by_id(db: Session, card_id: UUID) -> Card | None:
        return (
            db.query(Card)
            .options(
                joinedload(Card.card_set).joinedload(CardSet.tcg),
                joinedload(Card.variants),
            )
            .filter(Card.id == card_id)
            .first()
        )

    @staticmethod
    def get_card_variant(db: Session, variant_id: UUID) -> CardVariant | None:
        return (
            db.query(CardVariant)
            .options(
                joinedload(CardVariant.card).joinedload(Card.card_set).joinedload(CardSet.tcg),
            )
            .filter(CardVariant.id == variant_id)
            .first()
        )

    @staticmethod
    def list_tcgs(db: Session) -> list[TCG]:
        return db.query(TCG).order_by(TCG.name).all()

    @staticmethod
    def list_sets(db: Session, tcg_id: UUID | None = None) -> list[CardSet]:
        query = db.query(CardSet).join(TCG)
        if tcg_id:
            query = query.filter(CardSet.tcg_id == tcg_id)
        return query.order_by(CardSet.release_date.desc().nullslast()).all()
