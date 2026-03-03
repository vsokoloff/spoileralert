from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.expiration_db import get_color_code
from datetime import datetime

router = APIRouter()

# For MVP, we'll use a default user_id (1)
# In production, this would come from authentication
DEFAULT_USER_ID = 1

@router.get("/", response_model=List[schemas.ItemResponse])
def get_items(
    category: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    expired_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all items with optional filtering"""
    query = db.query(models.Item).filter(models.Item.user_id == DEFAULT_USER_ID)
    
    if category:
        query = query.filter(models.Item.category == category)
    if location:
        query = query.filter(models.Item.location == location)
    if search:
        query = query.filter(models.Item.name.ilike(f"%{search}%"))
    if expired_only:
        query = query.filter(models.Item.expiration_date < datetime.now())
    
    items = query.filter(models.Item.consumed == False).all()
    return items

@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific item"""
    item = db.query(models.Item).filter(
        models.Item.id == item_id,
        models.Item.user_id == DEFAULT_USER_ID
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/", response_model=schemas.ItemResponse)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    """Create a new item"""
    try:
        item_dict = item.dict()
        # Ensure category and location are proper enum values
        if isinstance(item_dict.get('category'), str):
            item_dict['category'] = models.CategoryType(item_dict['category'])
        if isinstance(item_dict.get('location'), str):
            item_dict['location'] = models.LocationType(item_dict['location'].lower())
        
        db_item = models.Item(**item_dict, user_id=DEFAULT_USER_ID)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Error creating item: {str(e)}")

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(item_id: int, item_update: schemas.ItemUpdate, db: Session = Depends(get_db)):
    """Update an item"""
    db_item = db.query(models.Item).filter(
        models.Item.id == item_id,
        models.Item.user_id == DEFAULT_USER_ID
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    try:
        update_data = item_update.dict(exclude_unset=True)
        
        # Handle category and location enum conversion
        if 'category' in update_data and isinstance(update_data['category'], str):
            update_data['category'] = models.CategoryType(update_data['category'])
        if 'location' in update_data and isinstance(update_data['location'], str):
            update_data['location'] = models.LocationType(update_data['location'].lower())
        
        for field, value in update_data.items():
            setattr(db_item, field, value)
        
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating item: {str(e)}")

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an item (moves to deleted_items for undo)"""
    db_item = db.query(models.Item).filter(
        models.Item.id == item_id,
        models.Item.user_id == DEFAULT_USER_ID
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Save to deleted_items
    import json
    deleted_item = models.DeletedItem(
        item_id=db_item.id,
        name=db_item.name,
        user_id=db_item.user_id,
        original_data=json.dumps({
            "name": db_item.name,
            "expiration_date": db_item.expiration_date.isoformat(),
            "quantity": db_item.quantity,
            "category": db_item.category.value,
            "location": db_item.location.value,
            "purchase_date": db_item.purchase_date.isoformat() if db_item.purchase_date else None,
        })
    )
    db.add(deleted_item)
    
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}

@router.get("/deleted/recent", response_model=List[dict])
def get_recently_deleted(db: Session = Depends(get_db)):
    """Get recently deleted items for undo"""
    deleted = db.query(models.DeletedItem).filter(
        models.DeletedItem.user_id == DEFAULT_USER_ID
    ).order_by(models.DeletedItem.deleted_at.desc()).limit(10).all()
    
    return [{"id": d.id, "name": d.name, "deleted_at": d.deleted_at, "original_data": d.original_data} for d in deleted]

@router.post("/deleted/{deleted_id}/restore", response_model=schemas.ItemResponse)
def restore_item(deleted_id: int, db: Session = Depends(get_db)):
    """Restore a deleted item"""
    deleted = db.query(models.DeletedItem).filter(
        models.DeletedItem.id == deleted_id,
        models.DeletedItem.user_id == DEFAULT_USER_ID
    ).first()
    if not deleted:
        raise HTTPException(status_code=404, detail="Deleted item not found")
    
    import json
    original_data = json.loads(deleted.original_data)
    original_data["expiration_date"] = datetime.fromisoformat(original_data["expiration_date"])
    if original_data["purchase_date"]:
        original_data["purchase_date"] = datetime.fromisoformat(original_data["purchase_date"])
    
    # Create new item from original data
    new_item = models.Item(**original_data, user_id=DEFAULT_USER_ID)
    db.add(new_item)
    db.delete(deleted)
    db.commit()
    db.refresh(new_item)
    return new_item
