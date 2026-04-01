"""
backend/app/routers/notifications.py
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


def check_expiring_items(user_id: int, db: Session):
    """Check for expiring items and create notifications for the current user."""
    tomorrow = datetime.now() + timedelta(days=1)

    expiring_items = db.query(models.Item).filter(
        and_(
            models.Item.user_id == user_id,
            models.Item.consumed == False,
            models.Item.expiration_date <= tomorrow,
            models.Item.expiration_date >= datetime.now(),
        )
    ).all()

    for item in expiring_items:
        existing = db.query(models.Notification).filter(
            and_(
                models.Notification.user_id == user_id,
                models.Notification.item_id == item.id,
                models.Notification.read == False,
            )
        ).first()

        if not existing:
            days_left = (item.expiration_date - datetime.now()).days
            message = f"{item.name} expires {'today' if days_left == 0 else f'in {days_left} day(s)'}"
            db.add(models.Notification(
                user_id=user_id,
                message=message,
                item_id=item.id,
            ))

    db.commit()


@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all notifications for the current user."""
    check_expiring_items(current_user.id, db)

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
