"""Collection service."""
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from src.models.collection import CollectionItem
from src.models.tcg import CardVariant, Card, CardSet
from src.models.pricing import PriceSnapshot, PriceSource
from sqlalchemy import desc


class CollectionService:
    @staticmethod
    def add_item(db: Session, user_id: UUID, data: dict) -> CollectionItem:
        existing = (
            db.query(CollectionItem)
            .filter(
                CollectionItem.user_id == user_id,
                CollectionItem.card_variant_id == data["card_variant_id"],
            )
            .first()
        )
        if existing:
            existing.quantity += data.get("quantity", 1)
            existing.condition = data.get("condition") or existing.condition
            existing.notes = data.get("notes") or existing.notes
            db.commit()
            db.refresh(existing)
            return existing
        item = CollectionItem(user_id=user_id, **data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item(db: Session, user_id: UUID, item_id: UUID, data: dict) -> CollectionItem | None:
        item = db.query(CollectionItem).filter(
            CollectionItem.id == item_id,
            CollectionItem.user_id == user_id,
        ).first()
        if not item:
            return None
        for k, v in data.items():
            if v is not None and hasattr(item, k):
                setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, user_id: UUID, item_id: UUID) -> bool:
        r = db.query(CollectionItem).filter(
            CollectionItem.id == item_id,
            CollectionItem.user_id == user_id,
        ).delete()
        db.commit()
        return r > 0

    @staticmethod
    def list_items(
        db: Session,
        user_id: UUID,
        tcg_id: UUID | None = None,
        set_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CollectionItem], int]:
        query = (
            db.query(CollectionItem)
            .join(CardVariant)
            .join(Card)
            .join(CardSet)
            .filter(CollectionItem.user_id == user_id)
            .options(
                joinedload(CollectionItem.card_variant).joinedload(CardVariant.card).joinedload(Card.card_set).joinedload(CardSet.tcg),
            )
        )
        if tcg_id:
            query = query.filter(CardSet.tcg_id == tcg_id)
        if set_id:
            query = query.filter(Card.card_set_id == set_id)
        total = query.count()
        items = query.order_by(CollectionItem.created_at.desc()).offset(offset).limit(limit).all()
        return items, total
