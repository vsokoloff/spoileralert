"""
backend/app/models.py
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base, DATABASE_URL
import enum


USE_ENUM = DATABASE_URL and not DATABASE_URL.startswith("sqlite")


class LocationType(str, enum.Enum):
    FRIDGE = "fridge"
    FREEZER = "freezer"
    PANTRY = "pantry"


class CategoryType(str, enum.Enum):
    DELI = "Deli"
    EGGS_DAIRY = "Eggs & Dairy"
    PRODUCE = "Produce"
    FREEZER = "Freezer"
    PANTRY = "Pantry"
    MEAT = "Meat"
    LEFTOVERS = "Leftovers"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    # ── NEW: stores bcrypt hash, never the raw password ──────────────────────
    hashed_password = Column(String, nullable=False)
    # ─────────────────────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())

    items = relationship("Item", back_populates="owner")
    roommates = relationship("Roommate", foreign_keys="Roommate.user_id", back_populates="user")
    shared_with = relationship("Roommate", foreign_keys="Roommate.roommate_id", back_populates="roommate")


class Roommate(Base):
    __tablename__ = "roommates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    roommate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="roommates")
    roommate = relationship("User", foreign_keys=[roommate_id], back_populates="shared_with")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    expiration_date = Column(DateTime(timezone=USE_ENUM), nullable=False)
    quantity = Column(Float, default=1.0)
    category = Column(SQLEnum(CategoryType) if USE_ENUM else String, nullable=False)
    location = Column(SQLEnum(LocationType) if USE_ENUM else String, nullable=False)
    purchase_date = Column(DateTime(timezone=USE_ENUM))
    consumed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_with = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())
    updated_at = Column(DateTime(timezone=USE_ENUM), onupdate=func.now())

    owner = relationship("User", back_populates="items")


class DeletedItem(Base):
    __tablename__ = "deleted_items"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    deleted_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_data = Column(Text)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)


class SPOYConversation(Base):
    __tablename__ = "spoy_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=USE_ENUM), server_default=func.now())
