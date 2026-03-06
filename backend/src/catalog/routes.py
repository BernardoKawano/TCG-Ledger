"""Catalog API routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.catalog.service import CatalogService
from src.catalog.schemas import CardResponse, CardSearchResult, TCGResponse, CardSetResponse

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _card_to_response(card) -> CardResponse:
    return CardResponse(
        id=card.id,
        name=card.name,
        number=card.number,
        rarity=card.rarity,
        image_url=card.image_url,
        card_set=CardSetResponse(
            id=card.card_set.id,
            slug=card.card_set.slug,
            name=card.card_set.name,
            release_date=card.card_set.release_date,
        )
        if card.card_set
        else None,
        tcg=TCGResponse(id=card.card_set.tcg.id, slug=card.card_set.tcg.slug, name=card.card_set.tcg.name)
        if card.card_set and card.card_set.tcg
        else None,
        variants=[{"id": v.id, "sku": v.sku} for v in (card.variants or [])],
    )


@router.get("/tcgs", response_model=list[TCGResponse])
def list_tcgs(db: Session = Depends(get_db)):
    """List all supported TCGs."""
    return CatalogService.list_tcgs(db)


@router.get("/sets", response_model=list[CardSetResponse])
def list_sets(tcg_id: UUID | None = Query(None), db: Session = Depends(get_db)):
    """List card sets, optionally filtered by TCG."""
    return CatalogService.list_sets(db, tcg_id=tcg_id)


@router.get("/cards/search", response_model=CardSearchResult)
def search_cards(
    q: str | None = Query(None),
    tcg_id: UUID | None = Query(None),
    set_id: UUID | None = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Search cards by name/number with optional filters."""
    cards, total = CatalogService.search_cards(db, q=q, tcg_id=tcg_id, set_id=set_id, limit=limit, offset=offset)
    return CardSearchResult(
        cards=[_card_to_response(c) for c in cards],
        total=total,
    )


@router.get("/cards/{card_id}", response_model=CardResponse)
def get_card(card_id: UUID, db: Session = Depends(get_db)):
    """Get card by ID."""
    card = CatalogService.get_card_by_id(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return _card_to_response(card)
