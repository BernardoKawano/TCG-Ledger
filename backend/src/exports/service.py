"""Export generation service."""
import csv
import io
import json
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from src.models.collection import CollectionItem
from src.models.tcg import CardVariant, Card, CardSet, TCG


class ExportService:
    @staticmethod
    def generate_json(db: Session, user_id: UUID) -> str:
        """Export collection as JSON."""
        items = (
            db.query(CollectionItem)
            .filter(CollectionItem.user_id == user_id)
            .options(
                joinedload(CollectionItem.card_variant).joinedload(CardVariant.card).joinedload(Card.card_set).joinedload(CardSet.tcg),
            )
            .all()
        )
        out = []
        for i in items:
            card = i.card_variant.card if i.card_variant else None
            s = card.card_set if card else None
            t = s.tcg if s else None
            out.append({
                "card_variant_id": str(i.card_variant_id),
                "quantity": i.quantity,
                "condition": i.condition,
                "language": i.language,
                "foil": i.foil,
                "notes": i.notes,
                "card_name": card.name if card else None,
                "set_name": s.name if s else None,
                "tcg": t.slug if t else None,
            })
        return json.dumps(out, indent=2)

    @staticmethod
    def generate_csv(db: Session, user_id: UUID) -> str:
        """Export collection as CSV."""
        items = (
            db.query(CollectionItem)
            .filter(CollectionItem.user_id == user_id)
            .options(
                joinedload(CollectionItem.card_variant).joinedload(CardVariant.card).joinedload(Card.card_set).joinedload(CardSet.tcg),
            )
            .all()
        )
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["card_name", "set", "tcg", "quantity", "condition", "foil", "notes"])
        for i in items:
            card = i.card_variant.card if i.card_variant else None
            s = card.card_set if card else None
            t = s.tcg if s else None
            w.writerow([
                card.name if card else "",
                s.name if s else "",
                t.slug if t else "",
                i.quantity,
                i.condition or "",
                i.foil or "",
                i.notes or "",
            ])
        return buf.getvalue()
