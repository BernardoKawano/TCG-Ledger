"""Collection API routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.core.database import get_db
from src.auth.dependencies import get_current_user
from src.models.user import User
from src.models.collection import CollectionItem
from src.models.pricing import PriceSnapshot, PriceSource
from src.collection.service import CollectionService
from src.collection.schemas import (
    CollectionItemCreate,
    CollectionItemUpdate,
    CollectionItemResponse,
    CollectionListResponse,
)
from src.collection.portfolio import PortfolioService
from src.collection.portfolio_schemas import PortfolioResponse

router = APIRouter(prefix="/collection", tags=["collection"])


def _item_to_response(db: Session, item: CollectionItem) -> CollectionItemResponse:
    card = item.card_variant.card if item.card_variant else None
    set_ = card.card_set if card else None
    tcg = set_.tcg if set_ else None
    # Get latest price if available
    latest = (
        db.query(PriceSnapshot)
        .filter(PriceSnapshot.card_variant_id == item.card_variant_id)
        .order_by(desc(PriceSnapshot.snapshot_at))
        .first()
    )
    return CollectionItemResponse(
        id=item.id,
        card_variant_id=item.card_variant_id,
        quantity=item.quantity,
        condition=item.condition,
        language=item.language,
        foil=item.foil,
        notes=item.notes,
        card_name=card.name if card else None,
        set_name=set_.name if set_ else None,
        tcg_slug=tcg.slug if tcg else None,
        image_url=card.image_url if card else None,
        current_price=latest.price if latest else None,
        created_at=item.created_at,
    )


@router.post("/items", response_model=CollectionItemResponse)
def add_item(
    data: CollectionItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add card to collection."""
    item = CollectionService.add_item(
        db,
        current_user.id,
        {
            "card_variant_id": data.card_variant_id,
            "quantity": data.quantity,
            "condition": data.condition,
            "language": data.language,
            "foil": data.foil,
            "notes": data.notes,
        },
    )
    return _item_to_response(db, item)


@router.patch("/items/{item_id}", response_model=CollectionItemResponse)
def update_item(
    item_id: UUID,
    data: CollectionItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update collection item."""
    item = CollectionService.update_item(
        db,
        current_user.id,
        item_id,
        data.model_dump(exclude_unset=True),
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_response(db, item)


@router.delete("/items/{item_id}")
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove item from collection."""
    if not CollectionService.delete_item(db, current_user.id, item_id):
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


@router.get("/portfolio", response_model=PortfolioResponse)
def get_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get portfolio dashboard: total value, changes, by TCG."""
    return PortfolioService.get_portfolio_summary(db, current_user.id)


@router.get("", response_model=CollectionListResponse)
def list_collection(
    tcg_id: UUID | None = Query(None),
    set_id: UUID | None = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's collection with filters."""
    items, total = CollectionService.list_items(
        db, current_user.id, tcg_id=tcg_id, set_id=set_id, limit=limit, offset=offset
    )
    return CollectionListResponse(
        items=[_item_to_response(db, i) for i in items],
        total=total,
    )
