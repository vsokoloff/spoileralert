"""
backend/app/routers/receipt.py

Receipt scanning now uses Google Gemini Vision instead of OpenAI.
Auth is required for all endpoints.
"""

import json
import os
import traceback
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.expiration_db import (
    CATEGORY_DEFAULT_DAYS,
    EXPIRATION_DATABASE,
    _normalize_name,
    categorize_item,
)

router = APIRouter()

GEMINI_MODEL = "gemini-1.5-flash"

# ── Category normalization ─────────────────────────────────────────────────────

CATEGORY_NORMALIZE_MAP = {
    "shelf staples": models.CategoryType.PANTRY,
    "shelf staple": models.CategoryType.PANTRY,
    "pantry": models.CategoryType.PANTRY,
    "grains": models.CategoryType.PANTRY,
    "grain": models.CategoryType.PANTRY,
    "canned goods": models.CategoryType.PANTRY,
    "dairy": models.CategoryType.EGGS_DAIRY,
    "eggs & dairy": models.CategoryType.EGGS_DAIRY,
    "eggs and dairy": models.CategoryType.EGGS_DAIRY,
    "eggs": models.CategoryType.EGGS_DAIRY,
    "produce": models.CategoryType.PRODUCE,
    "vegetables": models.CategoryType.PRODUCE,
    "fruits": models.CategoryType.PRODUCE,
    "fruit": models.CategoryType.PRODUCE,
    "vegetable": models.CategoryType.PRODUCE,
    "fresh produce": models.CategoryType.PRODUCE,
    "meat": models.CategoryType.MEAT,
    "poultry": models.CategoryType.MEAT,
    "seafood": models.CategoryType.MEAT,
    "fish": models.CategoryType.MEAT,
    "protein": models.CategoryType.MEAT,
    "deli": models.CategoryType.DELI,
    "cold cuts": models.CategoryType.DELI,
    "freezer": models.CategoryType.FREEZER,
    "frozen": models.CategoryType.FREEZER,
    "frozen foods": models.CategoryType.FREEZER,
    "leftovers": models.CategoryType.LEFTOVERS,
    "leftover": models.CategoryType.LEFTOVERS,
}


def normalize_category(raw: str, item_name: str) -> models.CategoryType:
    if not raw:
        return categorize_item(item_name)
    normalized = raw.strip().lower()
    if normalized in CATEGORY_NORMALIZE_MAP:
        return CATEGORY_NORMALIZE_MAP[normalized]
    for cat in models.CategoryType:
        if cat.value.lower() == normalized:
            return cat
    return categorize_item(item_name)


# ── Expiration helper ──────────────────────────────────────────────────────────

def smart_expiration_date(
    item_name: str,
    generic_name: str,
    location: models.LocationType,
    category: models.CategoryType,
) -> datetime:
    purchase_date = datetime.now()
    shelf_life_days = None

    for name in [generic_name, item_name]:
        normalized = _normalize_name(name)
        raw = name.lower().strip()
        for key, days in EXPIRATION_DATABASE.items():
            if key in normalized or normalized in key:
                shelf_life_days = days
                break
        if shelf_life_days is None:
            for key, days in EXPIRATION_DATABASE.items():
                if key in raw or raw in key:
                    shelf_life_days = days
                    break
        if shelf_life_days is not None:
            break

    if shelf_life_days is None:
        shelf_life_days = CATEGORY_DEFAULT_DAYS.get(category, 5)

    if location == models.LocationType.FREEZER:
        shelf_life_days = max(shelf_life_days * 4, 90)
    elif location == models.LocationType.PANTRY and shelf_life_days < 14:
        shelf_life_days = 30

    return purchase_date + timedelta(days=shelf_life_days)


# ── Gemini vision scanning ─────────────────────────────────────────────────────

RECEIPT_PROMPT = """Look at this grocery receipt and extract all food items.

Return ONLY a JSON array. Each item must have these exact fields:
[
  {
    "name": "Clean readable display name",
    "generic_name": "simple generic food name for shelf life lookup",
    "quantity": 1,
    "category": "Produce",
    "location": "fridge"
  }
]

Rules for "name": Clean up store abbreviations into a readable product name.
  "Wfm Clementine Bag" → "Clementines", "Org Baby Spinach" → "Baby Spinach"

Rules for "generic_name": The simplest possible singular food name.
  "Clementines" → "clementine", "Baby Spinach" → "spinach"

Categories MUST be exactly one of: Deli, Eggs & Dairy, Produce, Freezer, Pantry, Meat, Leftovers
Location must be exactly one of: fridge, freezer, pantry
Frozen items → freezer, rice/pasta/canned goods → pantry, produce/meat/dairy → fridge
Counter fruits (bananas, avocados, tomatoes, onions) → pantry

Only include food items. Return valid JSON only, no markdown."""


def scan_receipt_with_gemini(image_base64: str) -> List[dict]:
    """Use Gemini Vision to scan receipt and extract food items."""
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("[receipt] GEMINI_API_KEY not set — returning mock data.")
        return [
            {"name": "Milk", "generic_name": "milk", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
            {"name": "Eggs", "generic_name": "eggs", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
        ]

    if not image_base64 or len(image_base64) < 100:
        raise ValueError("Image data appears invalid or too short.")

    client = genai.Client(api_key=api_key)

    image_part = types.Part.from_bytes(
        data=bytes(image_base64, "utf-8") if isinstance(image_base64, str) else image_base64,
        mime_type="image/jpeg",
    )

    # Decode base64 properly
    import base64
    image_bytes = base64.b64decode(image_base64)
    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

    content = ""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[RECEIPT_PROMPT, image_part],
        )
        content = response.text.strip()

        # Strip markdown fences if present
        if content.startswith("```"):
            parts = content.split("```")
            content = parts[1] if len(parts) > 1 else content
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        items = json.loads(content)
        print(f"[receipt] Parsed {len(items)} items from Gemini.")
        return items

    except json.JSONDecodeError as e:
        print(f"[receipt] JSON parse error: {e}. Raw: {content}")
        return []
    except Exception as e:
        print(f"[receipt] Gemini call failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/test")
def test_receipt_endpoint(
    current_user: models.User = Depends(get_current_user),
):
    """Check whether Gemini API key is configured."""
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "ok",
        "gemini_api_key_set": bool(api_key),
        "gemini_api_key_preview": f"{api_key[:8]}..." if api_key else "NOT SET",
    }


@router.post("/scan", response_model=schemas.ReceiptScanResponse)
def scan_receipt(
    request: schemas.ReceiptScanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Scan a receipt image and return extracted food items."""
    try:
        raw_items = scan_receipt_with_gemini(request.image_base64)
        items = []
        for raw in raw_items:
            try:
                name = raw.get("name", "").strip()
                if not name:
                    continue
                quantity = float(raw.get("quantity", 1))
                category = normalize_category(raw.get("category", ""), name)
                location_str = str(raw.get("location", "fridge")).lower().strip()
                location = {
                    "fridge": models.LocationType.FRIDGE,
                    "freezer": models.LocationType.FREEZER,
                    "pantry": models.LocationType.PANTRY,
                }.get(location_str, models.LocationType.FRIDGE)

                items.append(schemas.ReceiptItem(
                    name=name.title(),
                    quantity=quantity,
                    category=category,
                    location=location,
                ))
            except Exception as item_err:
                print(f"[receipt] Skipping malformed item {raw}: {item_err}")
                continue

        return schemas.ReceiptScanResponse(items=items[:20], confidence=0.95)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error scanning receipt: {type(e).__name__}: {e}")


@router.post("/scan/confirm")
def confirm_receipt_items(
    items: List[schemas.ItemCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Save confirmed scanned items to the current user's fridge."""
    try:
        created_items = []
        for item_data in items:
            try:
                item_dict = item_data.dict(exclude_unset=True)

                if not item_dict.get("category"):
                    item_dict["category"] = categorize_item(item_dict["name"])
                elif isinstance(item_dict.get("category"), str):
                    item_dict["category"] = normalize_category(item_dict["category"], item_dict["name"])

                if isinstance(item_dict.get("location"), str):
                    item_dict["location"] = models.LocationType(item_dict["location"].lower())

                if not item_dict.get("expiration_date"):
                    loc = item_dict.get("location", models.LocationType.FRIDGE)
                    cat = item_dict.get("category", models.CategoryType.PRODUCE)
                    item_dict["expiration_date"] = smart_expiration_date(
                        item_name=item_dict["name"],
                        generic_name=item_dict["name"],
                        location=loc,
                        category=cat,
                    )

                db_item = models.Item(**item_dict, user_id=current_user.id)
                db.add(db_item)
                created_items.append(db_item)

            except Exception as item_err:
                print(f"[receipt] Skipping item during confirm: {item_err}")
                traceback.print_exc()
                continue

        db.commit()
        for item in created_items:
            db.refresh(item)

        return {"message": f"Created {len(created_items)} items", "items": created_items}

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving scanned items: {e}")
