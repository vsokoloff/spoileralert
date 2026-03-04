from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import base64
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

def scan_receipt_with_openai(image_base64: str) -> List[dict]:
    """Use OpenAI GPT-4o vision to scan receipt and extract food items"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback mock data if no API key
        return [
            {"name": "Milk", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
            {"name": "Eggs", "quantity": 1, "category": "Eggs & Dairy", "location": "fridge"},
        ]

    client = OpenAI(api_key=api_key)

    prompt = """Look at this receipt image and extract all food/grocery items.
Return ONLY a JSON array with this exact format, nothing else:
[
  {"name": "Item Name", "quantity": 1, "category": "Produce", "location": "fridge"},
  ...
]

Rules:
- Only include food/grocery items, skip non-food items
- Categories must be one of: Deli, Eggs & Dairy, Produce, Freezer, Pantry, Meat, Leftovers
- Location must be one of: fridge, freezer, pantry
- Use logical defaults (e.g. frozen items → freezer, rice/pasta → pantry, fresh produce → fridge)
- Clean up item names (remove price, weight, store codes)
- quantity should be a number (default 1 if unclear)
- Return valid JSON only, no extra text"""

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
            name = raw.get("name", "Unknown Item").strip()
            if not name:
                continue

            quantity = float(raw.get("quantity", 1))
            category = raw.get("category", categorize_item(name))
            location_str = raw.get("location", "fridge").lower()

            # Map location string to enum
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
        raise HTTPException(status_code=500, detail=f"Error scanning receipt: {str(e)}")


@router.post("/scan/confirm")
def confirm_receipt_items(items: List[schemas.ItemCreate], db: Session = Depends(get_db)):
    """Confirm and save items from receipt scan"""
    created_items = []
    for item_data in items:
        # Calculate expiration if not provided
        if not item_data.expiration_date:
            item_data.expiration_date = get_expiration_date(
                item_data.name,
                item_data.purchase_date or datetime.now(),
                item_data.location
            )

        db_item = models.Item(**item_data.dict(), user_id=DEFAULT_USER_ID)
        db.add(db_item)
        created_items.append(db_item)

    db.commit()
    for item in created_items:
        db.refresh(item)

    return {"message": f"Created {len(created_items)} items", "items": created_items}
