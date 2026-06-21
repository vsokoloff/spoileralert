"""
backend/app/schemas.py
"""

import json
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Dict
from app.models import CategoryType, LocationType

CATEGORY_ALIASES = {}


# ── Item schemas ───────────────────────────────────────────────────────────────

class ItemBase(BaseModel):
    name: str
    expiration_date: datetime
    quantity: float = 1.0
    category: CategoryType
    location: LocationType
    purchase_date: Optional[datetime] = None
    consumed: bool = False
    shared_with: Optional[str] = None

    @field_validator('category', mode='before')
    @classmethod
    def normalize_category(cls, v):
        return v


class ItemCreate(ItemBase):
    category: Optional[CategoryType] = None
    expiration_date: Optional[datetime] = None
    shared_with: Optional[str] = None

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
    shared_with: Optional[str] = None


class ItemResponse(ItemBase):
    id: int
    user_id: int
    category: CategoryType
    expiration_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── User schemas ───────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: str


class UserCreate(UserBase):
    """Used for registration — accepts a plain-text password."""
    password: str = Field(..., min_length=8, description="At least 8 characters")


class UserResponse(UserBase):
    id: int
    created_at: datetime
    category_colors: Optional[Dict[str, str]] = None

    @field_validator("category_colors", mode="before")
    @classmethod
    def _parse_category_colors(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v

    class Config:
        from_attributes = True


class CategoryColorsUpdate(BaseModel):
    """Map of category name -> hex color, e.g. {"Produce": "#10b981"}."""
    colors: Dict[str, str]


# ── Auth schemas ───────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """JSON body login (email + password)."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Returned after a successful login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Roommate schemas ───────────────────────────────────────────────────────────

class RoommateCreate(BaseModel):
    roommate_email: str


# ── Receipt schemas ────────────────────────────────────────────────────────────

class ReceiptScanRequest(BaseModel):
    image_base64: str = Field(..., max_length=5_000_000)  # ~3.7 MB image limit


class ReceiptItem(BaseModel):
    name: str
    quantity: float = 1.0
    category: CategoryType
    location: LocationType = LocationType.FRIDGE


class ReceiptScanResponse(BaseModel):
    items: List[ReceiptItem]
    confidence: float


# ── SPOY schemas ───────────────────────────────────────────────────────────────

class SPOYMessage(BaseModel):
    message: str


class SPOYResponse(BaseModel):
    response: str
    suggested_items: List[str] = []


# ── Notification schemas ───────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    message: str
    read: bool
    created_at: datetime
    item_id: Optional[int] = None

    class Config:
        from_attributes = True
