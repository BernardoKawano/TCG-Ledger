"""Fuzzy matching of OCR text to catalog cards."""
from uuid import UUID

from rapidfuzz import fuzz, process
from sqlalchemy.orm import Session

from src.models.tcg import Card, CardVariant, CardSet
from sqlalchemy.orm import joinedload


def match_ocr_to_catalog(
    db: Session,
    ocr_text: str,
    tcg_id: UUID | None = None,
    limit: int = 10,
) -> list[tuple[CardVariant, float]]:
    """
    Match OCR text to card variants using fuzzy search.
    Returns list of (CardVariant, confidence) sorted by confidence.
    """
    # Build searchable strings: "CardName SetName" or "CardName SetSlug"
    query = (
        db.query(CardVariant)
        .join(Card)
        .join(CardSet)
        .options(joinedload(CardVariant.card).joinedload(Card.card_set).joinedload(CardSet.tcg))
    )
    if tcg_id:
        query = query.filter(CardSet.tcg_id == tcg_id)
    variants = query.all()

    if not variants:
        return []

    def key(v: CardVariant) -> str:
        card = v.card
        s = card.card_set
        return f"{card.name} {s.name} {s.slug} {card.number or ''}".strip()

    choices = {id(v): (v, key(v)) for v in variants}
    choice_keys = {k: v[1] for k, v in choices.items()}

    if not ocr_text or not ocr_text.strip():
        return []

    # Use rapidfuzz to find best matches
    results = process.extract(
        ocr_text.strip(),
        choice_keys,
        scorer=fuzz.token_set_ratio,
        limit=limit,
    )

    out = []
    for (idx, _), score, _ in results:
        variant, _ = choices[idx]
        confidence = score / 100.0
        out.append((variant, confidence))
    return out
