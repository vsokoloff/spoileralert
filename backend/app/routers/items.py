"""
backend/app/routers/items.py

Every endpoint now requires a valid JWT token.
The authenticated user's ID replaces the old DEFAULT_USER_ID = 1.
"""

import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.expiration_db import get_color_code, get_expiration_date, categorize_item

router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _owned_item(item_id: int, user_id: int, db: Session) -> models.Item:
    """Fetch an item that belongs to the current user, or raise 404."""
    item = db.query(models.Item).filter(
        models.Item.id == item_id,
        models.Item.user_id == user_id,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


# ── Read ───────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.ItemResponse])
def get_items(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    expired_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all non-consumed items belonging to the current user."""
    query = db.query(models.Item).filter(
        models.Item.user_id == current_user.id,
        models.Item.consumed == False,
    )
    if category:
        query = query.filter(models.Item.category == category)
    if location:
        query = query.filter(models.Item.location == location)
    if search:
        query = query.filter(models.Item.name.ilike(f"%{search}%"))
    if expired_only:
        query = query.filter(models.Item.expiration_date < datetime.now())

    return query.all()


@router.get("/deleted/recent", response_model=List[dict])
def get_recently_deleted(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return up to 10 recently deleted items for the current user."""
    deleted = (
        db.query(models.DeletedItem)
        .filter(models.DeletedItem.user_id == current_user.id)
        .order_by(models.DeletedItem.deleted_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": d.id,
            "name": d.name,
            "deleted_at": d.deleted_at,
            "original_data": d.original_data,
        }
        for d in deleted
    ]


@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _owned_item(item_id, current_user.id, db)


# ── Create ─────────────────────────────────────────────────────────────────────

@router.post("/", response_model=schemas.ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new item with auto-categorisation and expiration logic."""
    try:
        item_dict = item.dict(exclude_unset=True)

        # 1. Auto-categorise if missing
        if not item_dict.get("category"):
            item_dict["category"] = categorize_item(item_dict["name"])
        elif isinstance(item_dict.get("category"), str):
            item_dict["category"] = models.CategoryType(item_dict["category"])

        # 2. Auto-route location based on category
        cat_val = (
            item_dict["category"].value
            if hasattr(item_dict["category"], "value")
            else item_dict["category"]
        )
        if cat_val == "Pantry":
            item_dict["location"] = models.LocationType.PANTRY
        elif cat_val == "Freezer":
            item_dict["location"] = models.LocationType.FREEZER

        # 3. Auto-compute expiration date if missing
        if not item_dict.get("expiration_date"):
            purchase_date = item_dict.get("purchase_date") or datetime.now()
            loc = item_dict.get("location", models.LocationType.FRIDGE)
            if isinstance(loc, str):
                loc = models.LocationType(loc.lower())
            item_dict["expiration_date"] = get_expiration_date(
                item_name=item_dict["name"],
                purchase_date=purchase_date,
                location=loc,
            )

        # 4. Coerce location string → enum
        if isinstance(item_dict.get("location"), str):
            item_dict["location"] = models.LocationType(item_dict["location"].lower())

        db_item = models.Item(**item_dict, user_id=current_user.id)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error creating item: {e}")


# ── Update ─────────────────────────────────────────────────────────────────────

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: int,
    item_update: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = _owned_item(item_id, current_user.id, db)
    try:
        update_data = item_update.dict(exclude_unset=True)

        if "category" in update_data and isinstance(update_data["category"], str):
            update_data["category"] = models.CategoryType(update_data["category"])
        if "location" in update_data and isinstance(update_data["location"], str):
            update_data["location"] = models.LocationType(update_data["location"].lower())

        for field, value in update_data.items():
            setattr(db_item, field, value)

        db.commit()
        db.refresh(db_item)
        return db_item

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error updating item: {e}")


# ── Delete ─────────────────────────────────────────────────────────────────────

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = _owned_item(item_id, current_user.id, db)
    try:
        cat_val = db_item.category.value if hasattr(db_item.category, "value") else str(db_item.category)
        loc_val = db_item.location.value if hasattr(db_item.location, "value") else str(db_item.location)
        exp_val = db_item.expiration_date.isoformat() if hasattr(db_item.expiration_date, "isoformat") else str(db_item.expiration_date)
        purch_val = (
            db_item.purchase_date.isoformat()
            if db_item.purchase_date and hasattr(db_item.purchase_date, "isoformat")
            else str(db_item.purchase_date) if db_item.purchase_date else None
        )

        deleted_item = models.DeletedItem(
            item_id=db_item.id,
            name=db_item.name,
            user_id=current_user.id,
            original_data=json.dumps({
                "name": db_item.name,
                "expiration_date": exp_val,
                "quantity": db_item.quantity,
                "category": cat_val,
                "location": loc_val,
                "purchase_date": purch_val,
            }),
        )
        db.add(deleted_item)
        db.delete(db_item)
        db.commit()
        return {"message": "Item deleted"}

    except Exception as e:
        db.rollback()
        print(f"DELETE ERROR for item {item_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete item: {e}")


# ── Restore ────────────────────────────────────────────────────────────────────

@router.post("/deleted/{deleted_id}/restore", response_model=schemas.ItemResponse)
def restore_item(
    deleted_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deleted = db.query(models.DeletedItem).filter(
        models.DeletedItem.id == deleted_id,
        models.DeletedItem.user_id == current_user.id,
    ).first()
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted item not found")

    original_data = json.loads(deleted.original_data)
    original_data["expiration_date"] = datetime.fromisoformat(original_data["expiration_date"])
    if original_data.get("purchase_date"):
        original_data["purchase_date"] = datetime.fromisoformat(original_data["purchase_date"])

    new_item = models.Item(**original_data, user_id=current_user.id)
    db.add(new_item)
    db.delete(deleted)
    db.commit()
    db.refresh(new_item)
    return new_item
