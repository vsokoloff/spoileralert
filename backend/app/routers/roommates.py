"""
backend/app/routers/roommates.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter()


@router.post("/add")
def add_roommate(
    roommate_email: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Add a roommate by email."""
    roommate_user = db.query(models.User).filter(
        models.User.email == roommate_email
    ).first()

    if not roommate_user:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    if roommate_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a roommate.")

    existing = db.query(models.Roommate).filter(
        models.Roommate.user_id == current_user.id,
        models.Roommate.roommate_id == roommate_user.id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already roommates.")

    # Create bidirectional relationship
    db.add(models.Roommate(user_id=current_user.id, roommate_id=roommate_user.id))
    db.add(models.Roommate(user_id=roommate_user.id, roommate_id=current_user.id))
    db.commit()

    return {"message": f"{roommate_user.name} added as a roommate."}


@router.get("/")
def get_roommates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all roommates for the current user."""
    roommates = db.query(models.Roommate).filter(
        models.Roommate.user_id == current_user.id
    ).all()

    roommate_ids = [r.roommate_id for r in roommates]
    users = db.query(models.User).filter(models.User.id.in_(roommate_ids)).all()

    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]


@router.delete("/{roommate_id}")
def remove_roommate(
    roommate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Remove a roommate (removes both directions)."""
    db.query(models.Roommate).filter(
        ((models.Roommate.user_id == current_user.id) &
         (models.Roommate.roommate_id == roommate_id)) |
        ((models.Roommate.user_id == roommate_id) &
         (models.Roommate.roommate_id == current_user.id))
    ).delete()

    db.commit()
    return {"message": "Roommate removed."}
