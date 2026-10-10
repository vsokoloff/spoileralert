"""
backend/app/routers/notifications.py
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


def _upsert_item_notification(user_id: int, item_id: int, message: str, db: Session):
    """Create an unread notification for an item, or refresh its message if one
    already exists (e.g. "expires in 2 day(s)" → "expires today")."""
    existing = db.query(models.Notification).filter(
        and_(
            models.Notification.user_id == user_id,
            models.Notification.item_id == item_id,
            models.Notification.read == False,
        )
    ).first()

    if existing:
        if existing.message != message:
            existing.message = message
    else:
        db.add(models.Notification(user_id=user_id, message=message, item_id=item_id))


def check_expiring_items(user_id: int, db: Session, days: int = 1, include_expired: bool = False):
    """Create/refresh notifications for items expiring within `days`, and
    (optionally) for items that have already expired."""
    now = datetime.now()
    cutoff = now + timedelta(days=days)

    expiring_items = db.query(models.Item).filter(
        and_(
            models.Item.user_id == user_id,
            models.Item.consumed == False,
            models.Item.expiration_date <= cutoff,
            models.Item.expiration_date >= now,
        )
    ).all()

    for item in expiring_items:
        # Calendar days, not truncated 24h periods ("expires in 2 days" for the
        # day after tomorrow, even if it's only 1.9 x 24h away).
        days_left = (item.expiration_date.date() - now.date()).days
        message = f"{item.name} expires {'today' if days_left == 0 else f'in {days_left} day(s)'}"
        _upsert_item_notification(user_id, item.id, message, db)

    if include_expired:
        expired_items = db.query(models.Item).filter(
            and_(
                models.Item.user_id == user_id,
                models.Item.consumed == False,
                models.Item.expiration_date < now,
            )
        ).all()

        for item in expired_items:
            days_ago = (now.date() - item.expiration_date.date()).days
            message = f"{item.name} expired {'today' if days_ago == 0 else f'{days_ago} day(s) ago'} — time to toss it"
            _upsert_item_notification(user_id, item.id, message, db)

    db.commit()


@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    days: int = Query(1, ge=1, le=7, description="Alert for items expiring within this many days"),
    include_expired: bool = Query(False, description="Also alert for already-expired items"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all notifications for the current user."""
    check_expiring_items(current_user.id, db, days=days, include_expired=include_expired)

    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    )
    if unread_only:
        query = query.filter(models.Notification.read == False)

    return query.order_by(models.Notification.created_at.desc()).all()


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ).first()

    if not notification:
        return {"message": "Notification not found"}

    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a notification."""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ).first()

    if not notification:
        return {"message": "Notification not found"}

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}
