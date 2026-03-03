from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import List, Dict

router = APIRouter()

DEFAULT_USER_ID = 1

@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    """Get all categories with item counts"""
    categories = []
    for category in models.CategoryType:
        count = db.query(func.count(models.Item.id)).filter(
            models.Item.category == category,
            models.Item.user_id == DEFAULT_USER_ID,
            models.Item.consumed == False
        ).scalar()
        categories.append({"name": category.value, "count": count})
    return categories

@router.get("/{category}/items", response_model=List[schemas.ItemResponse])
def get_items_by_category(category: str, db: Session = Depends(get_db)):
    """Get all items in a specific category"""
    try:
        category_enum = models.CategoryType(category)
    except ValueError:
        return []
    
    items = db.query(models.Item).filter(
        models.Item.category == category_enum,
        models.Item.user_id == DEFAULT_USER_ID,
        models.Item.consumed == False
    ).all()
    return items
