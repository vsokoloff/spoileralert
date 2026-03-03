from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()

DEFAULT_USER_ID = 1

@router.post("/add")
def add_roommate(roommate_email: str, db: Session = Depends(get_db)):
    """Add a roommate"""
    # Find roommate by email
    roommate_user = db.query(models.User).filter(
        models.User.email == roommate_email
    ).first()
    
    if not roommate_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if roommate_user.id == DEFAULT_USER_ID:
        raise HTTPException(status_code=400, detail="Cannot add yourself as roommate")
    
    # Check if already roommates
    existing = db.query(models.Roommate).filter(
        (models.Roommate.user_id == DEFAULT_USER_ID) &
        (models.Roommate.roommate_id == roommate_user.id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already roommates")
    
    # Create roommate relationship (bidirectional)
    roommate1 = models.Roommate(
        user_id=DEFAULT_USER_ID,
        roommate_id=roommate_user.id
    )
    roommate2 = models.Roommate(
        user_id=roommate_user.id,
        roommate_id=DEFAULT_USER_ID
    )
    
    db.add(roommate1)
    db.add(roommate2)
    db.commit()
    
    return {"message": "Roommate added successfully"}

@router.get("/")
def get_roommates(db: Session = Depends(get_db)):
    """Get all roommates"""
    roommates = db.query(models.Roommate).filter(
        models.Roommate.user_id == DEFAULT_USER_ID
    ).all()
    
    roommate_ids = [r.roommate_id for r in roommates]
    users = db.query(models.User).filter(
        models.User.id.in_(roommate_ids)
    ).all()
    
    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]

@router.delete("/{roommate_id}")
def remove_roommate(roommate_id: int, db: Session = Depends(get_db)):
    """Remove a roommate"""
    # Remove both directions
    db.query(models.Roommate).filter(
        ((models.Roommate.user_id == DEFAULT_USER_ID) &
         (models.Roommate.roommate_id == roommate_id)) |
        ((models.Roommate.user_id == roommate_id) &
         (models.Roommate.roommate_id == DEFAULT_USER_ID))
    ).delete()
    
    db.commit()
    return {"message": "Roommate removed"}
