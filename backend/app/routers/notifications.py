from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.database import get_db
from app import models, schemas
from typing import List

router = APIRouter()

DEFAULT_USER_ID = 1

def check_expiring_items(db: Session):
    """Check for expiring items and create notifications"""
    # Items expiring in next 24 hours
    tomorrow = datetime.now() + timedelta(days=1)
    
    expiring_items = db.query(models.Item).filter(
        and_(
            models.Item.user_id == DEFAULT_USER_ID,
            models.Item.consumed == False,
            models.Item.expiration_date <= tomorrow,
            models.Item.expiration_date >= datetime.now()
        )
    ).all()
    
    notifications = []
    for item in expiring_items:
        # Check if notification already exists
        existing = db.query(models.Notification).filter(
            and_(
                models.Notification.user_id == DEFAULT_USER_ID,
                models.Notification.item_id == item.id,
                models.Notification.read == False
            )
        ).first()
        
        if not existing:
            days_left = (item.expiration_date - datetime.now()).days
            message = f"{item.name} expires {'today' if days_left == 0 else f'in {days_left} days'}"
            
            notification = models.Notification(
                user_id=DEFAULT_USER_ID,
                message=message,
                item_id=item.id
            )
            db.add(notification)
            notifications.append(notification)
    
    db.commit()
    return notifications

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(get_db), unread_only: bool = False):
    """Get all notifications"""
    # Check for new expiring items
    check_expiring_items(db)
    
    query = db.query(models.Notification).filter(
        models.Notification.user_id == DEFAULT_USER_ID
    )
    
    if unread_only:
        query = query.filter(models.Notification.read == False)
    
    notifications = query.order_by(models.Notification.created_at.desc()).all()
    return notifications

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark notification as read"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == DEFAULT_USER_ID
    ).first()
    
    if not notification:
        return {"message": "Notification not found"}
    
    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    """Delete a notification"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == DEFAULT_USER_ID
    ).first()
    
    if not notification:
        return {"message": "Notification not found"}
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}
