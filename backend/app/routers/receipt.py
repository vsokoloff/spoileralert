from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import json
from openai import OpenAI
from app.database import get_db
from app import models, schemas
from app.expiration_db import get_expiration_date, categorize_item
from datetime import datetime
from typing import List

router = APIRouter()

DEFAULT_USER_ID = 1

# FIX: Map any reasonable GPT output to a valid CategoryType value.
# GPT sometimes returns "Shelf Staples", "Dairy", "Grain", etc.
CATEGORY_NORMALIZE_MAP = {
    "shelf staples": models.CategoryType.PANTRY,
    "shelf staple": models.CategoryType.PANTRY,
    "pantry": models.CategoryType.PANTRY,
    "grains": models.CategoryType.PANTRY,
    "grain": models.CategoryType.PANTRY,
    "dairy": models.CategoryType.EGGS_DAIRY,
    "eggs & dairy": models.CategoryType.EGGS_DAIRY,
    "eggs and dairy": models.CategoryType.EGGS_DAIRY,
    "eggs": models.CategoryType.EGGS_DAIRY,
    "produce": models.CategoryType.PRODUCE,
    "vegetables": models.CategoryType.PRODUCE,
    "fruits": models.CategoryType.PRODUCE,
    "fruit": models.CategoryType.PRODUCE,
    "vegetable": models.CategoryType.PRODUCE,
    "meat": models.CategoryType.MEAT,
    "poultry": models.CategoryType.MEAT,
    "seafood": models.CategoryType.MEAT,
    "fish": models.CategoryType.MEAT,
    "deli": models.CategoryType.DELI,
    "cold cuts": models.CategoryType.DELI,
    "freezer": models.CategoryType.FREEZER,
    "frozen": models.CategoryType.FREEZER,
    "leftovers": models.CategoryType.LEFTOVERS,
    "leftover": models.CategoryType.LEFTOVERS,
}

def normalize_category(raw: str, item_name: str) -> models.CategoryType:
    """Safely convert GPT category string to a valid CategoryType enum."""
    if not raw:
        return categorize_item(item_name)
    normalized = raw.strip().lower()
    if normalized in CATEGORY_NORMALIZE_MAP:
        return CATEGORY_NORMALIZE_MAP[normalized]
    # Try direct enum match
    for cat in models.CategoryType:
        if cat.value.lower() == normalized:
            return cat
    # Final fallback: auto-categorize by item name
    print(f"Unknown category '{raw}' for item '{item_name}', auto-categorizing.")
    return categorize_item(item_name)


def scan_receipt_with_openai(image_base64: str) -> List[dict]:
    """Use OpenAI GPT-4o vision to scan receipt and extract food items"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return [
            {"name": "Milk", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
            {"name": "Eggs", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
        ]

    client = OpenAI(api_key=api_key, timeout=30.0, max_retries=2)

    # FIX: Categories in the prompt now exactly match CategoryType enum values.
    prompt = """Look at this receipt image and extract all food/grocery items.
Return ONLY a JSON array with this exact format, nothing else:
[
  {"name": "Item Name", "quantity": 1, "category": "Produce", "location": "fridge"},
  ...
]

Rules:
- Only include food/grocery items, skip non-food items
- Categories MUST be exactly one of: Deli, Eggs & Dairy, Produce, Freezer, Pantry, Meat, Leftovers
- Location must be exactly one of: fridge, freezer, pantry
- Use logical defaults (frozen items → freezer, rice/pasta/canned goods → pantry, fresh produce/meat/dairy → fridge)
- Clean up item names (remove price, weight, store codes)
- quantity should be a number (default 1 if unclear)
- Return valid JSON only, no markdown, no extra text"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        items = json.loads(content)
        return items

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}, content: {content}")
        return []
    except Exception as e:
        print(f"OpenAI Vision error: {e}")
        return []


@router.post("/scan", response_model=schemas.ReceiptScanResponse)
def scan_receipt(request: schemas.ReceiptScanRequest, db: Session = Depends(get_db)):
    """Scan receipt and extract items using OpenAI Vision"""
    try:
        raw_items = scan_receipt_with_openai(request.image_base64)

        items = []
        for raw in raw_items:
            name = raw.get("name", "").strip()
            if not name:
                continue

            quantity = float(raw.get("quantity", 1))

            # FIX: Use normalize_category instead of raw string pass-through
            category = normalize_category(raw.get("category", ""), name)

            location_str = raw.get("location", "fridge").lower()
            location_map = {
                "fridge": models.LocationType.FRIDGE,
                "freezer": models.LocationType.FREEZER,
                "pantry": models.LocationType.PANTRY,
            }
            location = location_map.get(location_str, models.LocationType.FRIDGE)

            items.append(schemas.ReceiptItem(
                name=name.title(),
                quantity=quantity,
                category=category,
                location=location
            ))

        return schemas.ReceiptScanResponse(
            items=items[:20],
            confidence=0.95
        )
    except Exception as e:
        print(f"scan_receipt error: {e}")
        raise HTTPException(status_code=500, detail=f"Error scanning receipt: {str(e)}")


@router.post("/scan/confirm")
def confirm_receipt_items(items: List[schemas.ItemCreate], db: Session = Depends(get_db)):
    """Confirm and save items from receipt scan"""
    try:
        created_items = []
        for item_data in items:
            item_dict = item_data.dict(exclude_unset=True)

            # Auto-categorize if missing
            if 'category' not in item_dict or item_dict['category'] is None:
                item_dict['category'] = categorize_item(item_dict['name'])
            elif isinstance(item_dict.get('category'), str):
                # FIX: Use normalize_category for safety here too
                item_dict['category'] = normalize_category(item_dict['category'], item_dict['name'])

            # Auto-compute expiration date if missing
            if 'expiration_date' not in item_dict or item_dict['expiration_date'] is None:
                purchase_date = item_dict.get('purchase_date') or datetime.now()
                loc = item_dict.get('location', models.LocationType.FRIDGE)
                if isinstance(loc, str):
                    loc = models.LocationType(loc.lower())
                item_dict['expiration_date'] = get_expiration_date(
                    item_name=item_dict['name'],
                    purchase_date=purchase_date,
                    location=loc
                )

            if isinstance(item_dict.get('location'), str):
                item_dict['location'] = models.LocationType(item_dict['location'].lower())

            db_item = models.Item(**item_dict, user_id=DEFAULT_USER_ID)
            db.add(db_item)
            created_items.append(db_item)

        db.commit()
        for item in created_items:
            db.refresh(item)

        return {"message": f"Created {len(created_items)} items", "items": created_items}

    except Exception as e:
        db.rollback()
        print(f"confirm_receipt_items error: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving scanned items: {str(e)}")