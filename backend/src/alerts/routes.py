"""Alerts API routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.auth.dependencies import get_current_user
from src.models.user import User
from src.models.alerts import AlertRule, AlertEvent
from src.alerts.schemas import AlertRuleCreate, AlertRuleResponse, AlertEventResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/rules", response_model=list[AlertRuleResponse])
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's alert rules."""
    rules = db.query(AlertRule).filter(AlertRule.user_id == current_user.id).all()
    return [AlertRuleResponse(id=r.id, type=r.type_, config=r.config, enabled=r.enabled) for r in rules]


@router.post("/rules", response_model=AlertRuleResponse)
def create_rule(
    data: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create alert rule."""
    rule = AlertRule(user_id=current_user.id, type_=data.type, config=data.config)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return AlertRuleResponse(id=rule.id, type=rule.type_, config=rule.config, enabled=rule.enabled)


@router.get("", response_model=list[AlertEventResponse])
def list_alerts(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's alert events."""
    events = (
        db.query(AlertEvent)
        .filter(AlertEvent.user_id == current_user.id)
        .order_by(AlertEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        AlertEventResponse(
            id=e.id,
            card_variant_id=e.card_variant_id,
            old_price=e.old_price,
            new_price=e.new_price,
            change_pct=e.change_pct,
            created_at=e.created_at,
        )
        for e in events
    ]
