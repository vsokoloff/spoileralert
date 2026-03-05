from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from app.models import CategoryType, LocationType

# Map old category names to new ones (for DB migration safety)
CATEGORY_ALIASES = {
    "Pantry": "Shelf Staples",
}

# 1. Remove category and expiration_date from the base model
class ItemBase(BaseModel):
    name: str
    quantity: float = 1.0
    location: LocationType
    purchase_date: Optional[datetime] = None
    consumed: bool = False
    
    # NEW: Allow the frontend to send and receive this tag
    shared_with: Optional[str] = None

# 2. Make them Optional for creation so the frontend doesn't have to send them
class ItemCreate(ItemBase):
    category: Optional[CategoryType] = None
    expiration_date: Optional[datetime] = None

    @field_validator('category', mode='before')
    @classmethod
    def normalize_category(cls, v):
        if isinstance(v, str):
            v = CATEGORY_ALIASES.get(v, v)
        return v

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    expiration_date: Optional[datetime] = None
    quantity: Optional[float] = None
    category: Optional[CategoryType] = None
    location: Optional[LocationType] = None
    purchase_date: Optional[datetime] = None
    consumed: Optional[bool] = None

# 3. Make them required in the Response so the frontend always receives them
class ItemResponse(ItemBase):
    id: int
    user_id: int
    category: CategoryType
    expiration_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class RoommateCreate(BaseModel):
    roommate_email: str

class ReceiptScanRequest(BaseModel):
    image_base64: str

class ReceiptItem(BaseModel):
    name: str
    quantity: float = 1.0
    category: CategoryType
    location: LocationType = LocationType.FRIDGE

class ReceiptScanResponse(BaseModel):
    items: List[ReceiptItem]
    confidence: float

class SPOYMessage(BaseModel):
    message: str

class SPOYResponse(BaseModel):
    response: str
    suggested_items: List[str] = []

class NotificationResponse(BaseModel):
    id: int
    message: str
    read: bool
    created_at: datetime
    item_id: Optional[int] = None
    
    class Config:
        from_attributes = True