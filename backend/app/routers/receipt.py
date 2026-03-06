from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import json
import traceback
from openai import OpenAI
from app.database import get_db
from app import models, schemas
from app.expiration_db import get_expiration_date, categorize_item, EXPIRATION_DATABASE, CATEGORY_DEFAULT_DAYS, _normalize_name
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

DEFAULT_USER_ID = 1

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
    print(f"[receipt] Unknown category '{raw}' for '{item_name}', falling back to auto-categorize.")
    return categorize_item(item_name)


def smart_expiration_date(item_name: str, generic_name: str,
                          location: models.LocationType,
                          category: models.CategoryType) -> datetime:
    """
    Calculate expiration date using normalized name lookup.
    Uses _normalize_name to handle plurals and parentheticals before DB lookup.
    Falls back to category-based defaults instead of a blanket 7 days.
    """
    purchase_date = datetime.now()
    shelf_life_days = None

    # Try both the generic name and the display name, both normalized
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
        print(f"[receipt] No match for '{item_name}'/'{generic_name}', using category default: {shelf_life_days}d")

    # Location adjustments
    if location == models.LocationType.FREEZER:
        shelf_life_days = max(shelf_life_days * 4, 90)
    elif location == models.LocationType.PANTRY and shelf_life_days < 14:
        shelf_life_days = 30

    return purchase_date + timedelta(days=shelf_life_days)


def scan_receipt_with_openai(image_base64: str) -> List[dict]:
    """Use OpenAI GPT-4o vision to scan receipt and extract food items."""
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("[receipt] OPENAI_API_KEY not set — returning mock data.")
        return [
            {"name": "Milk", "generic_name": "milk", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
            {"name": "Eggs", "generic_name": "eggs", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
        ]

    if not image_base64 or len(image_base64) < 100:
        raise ValueError("Image data appears invalid or too short.")

    print(f"[receipt] Sending image to OpenAI Vision. Base64 length: {len(image_base64)}")

    client = OpenAI(api_key=api_key, timeout=45.0, max_retries=1)

    prompt = """Look at this grocery receipt and extract all food items.

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
  "Wfm Clementine Bag" → "Clementines", "Bc Nf Van Grk Ygrt" → "Greek Yogurt",
  "Mitica Parm Reg Gra" → "Parmesan", "Org Baby Spinach" → "Baby Spinach"

Rules for "generic_name": The simplest possible singular food name.
  "Clementines" → "clementine", "Greek Yogurt" → "greek yogurt",
  "Parmesan" → "parmesan", "Ground Beef 85%" → "ground beef",
  "Baby Spinach" → "spinach", "Green Beans" → "green bean"

Categories MUST be exactly one of: Deli, Eggs & Dairy, Produce, Freezer, Pantry, Meat, Leftovers
Location must be exactly one of: fridge, freezer, pantry
Frozen items → freezer, rice/pasta/canned goods → pantry, produce/meat/dairy → fridge
Counter fruits that should NOT be refrigerated (bananas, avocados, tomatoes, onions) → pantry

Only include food items, skip non-food. Return valid JSON only, no markdown."""

    content = ""
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
            max_tokens=1200
        )

        content = response.choices[0].message.content.strip()
        print(f"[receipt] Raw GPT response: {content[:500]}")

        if content.startswith("```"):
            parts = content.split("```")
            content = parts[1] if len(parts) > 1 else content
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        items = json.loads(content)
        print(f"[receipt] Parsed {len(items)} items from GPT.")
        return items

    except json.JSONDecodeError as e:
        print(f"[receipt] JSON parse error: {e}. Raw content: {content}")
        return []
    except Exception as e:
        print(f"[receipt] OpenAI call failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise


@router.get("/test")
def test_receipt_endpoint():
    api_key = os.getenv("OPENAI_API_KEY")
    has_key = bool(api_key)
    result = {
        "status": "ok",
        "openai_api_key_set": has_key,
        "openai_api_key_preview": f"{api_key[:8]}..." if api_key else "NOT SET",
    }
    if has_key:
        try:
            client = OpenAI(api_key=api_key, timeout=10.0, max_retries=1)
            client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            result["openai_reachable"] = True
        except Exception as e:
            result["openai_reachable"] = False
            result["openai_error"] = f"{type(e).__name__}: {str(e)}"
    return result


@router.post("/scan", response_model=schemas.ReceiptScanResponse)
def scan_receipt(request: schemas.ReceiptScanRequest, db: Session = Depends(get_db)):
    try:
        raw_items = scan_receipt_with_openai(request.image_base64)
        items = []
        for raw in raw_items:
            try:
                name = raw.get("name", "").strip()
                if not name:
                    continue
                generic_name = raw.get("generic_name", name).strip()
                quantity = float(raw.get("quantity", 1))
                category = normalize_category(raw.get("category", ""), name)
                location_str = str(raw.get("location", "fridge")).lower().strip()
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
                    location=location,
                ))
            except Exception as item_err:
                print(f"[receipt] Skipping malformed item {raw}: {item_err}")
                continue

        print(f"[receipt] Returning {len(items)} valid items.")
        return schemas.ReceiptScanResponse(items=items[:20], confidence=0.95)

    except Exception as e:
        print(f"[receipt] scan_receipt error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error scanning receipt: {type(e).__name__}: {str(e)}")


@router.post("/scan/confirm")
def confirm_receipt_items(items: List[schemas.ItemCreate], db: Session = Depends(get_db)):
    try:
        created_items = []
        for item_data in items:
            try:
                item_dict = item_data.dict(exclude_unset=True)

                if 'category' not in item_dict or item_dict['category'] is None:
                    item_dict['category'] = categorize_item(item_dict['name'])
                elif isinstance(item_dict.get('category'), str):
                    item_dict['category'] = normalize_category(item_dict['category'], item_dict['name'])

                if isinstance(item_dict.get('location'), str):
                    item_dict['location'] = models.LocationType(item_dict['location'].lower())

                if 'expiration_date' not in item_dict or item_dict['expiration_date'] is None:
                    loc = item_dict.get('location', models.LocationType.FRIDGE)
                    cat = item_dict.get('category', models.CategoryType.PRODUCE)
                    item_dict['expiration_date'] = smart_expiration_date(
                        item_name=item_dict['name'],
                        generic_name=item_dict['name'],
                        location=loc,
                        category=cat,
                    )

                db_item = models.Item(**item_dict, user_id=DEFAULT_USER_ID)
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
        print(f"[receipt] confirm error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving scanned items: {str(e)}")