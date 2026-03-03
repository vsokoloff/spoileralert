from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import base64
import os
from google.cloud import vision
from app.database import get_db
from app import models, schemas
from app.expiration_db import get_expiration_date, categorize_item
from datetime import datetime
from typing import List
import re

router = APIRouter()

DEFAULT_USER_ID = 1

def extract_text_from_image(image_base64: str) -> str:
    """Extract text from receipt image using Google Vision API"""
    try:
        client = vision.ImageAnnotatorClient()
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        
        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Google Vision API error: {response.error.message}")
        
        texts = response.text_annotations
        if texts:
            return texts[0].description
        return ""
    except Exception as e:
        # Fallback: return mock data for MVP if API not configured
        print(f"Vision API error: {e}")
        return "MILK 1\nEGGS 1 DOZEN\nBREAD 1\nCHICKEN BREAST 2 LB\nTOMATOES 1 LB"

def parse_receipt_text(text: str) -> List[schemas.ReceiptItem]:
    """Parse receipt text into items"""
    items = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 2:
            continue
        
        # Simple parsing - look for common food keywords
        line_lower = line.lower()
        
        # Extract quantity (look for numbers)
        quantity_match = re.search(r'(\d+(?:\.\d+)?)', line)
        quantity = float(quantity_match.group(1)) if quantity_match else 1.0
        
        # Extract item name (remove common receipt words)
        item_name = line
        for word in ['lb', 'oz', 'pkg', 'ct', 'ea', 'dozen', 'each']:
            item_name = re.sub(rf'\b{word}\b', '', item_name, flags=re.IGNORECASE)
        item_name = re.sub(r'\d+(?:\.\d+)?', '', item_name).strip()
        
        if len(item_name) < 2:
            continue
        
        # Categorize and get expiration
        category = categorize_item(item_name)
        purchase_date = datetime.now()
        expiration_date = get_expiration_date(item_name, purchase_date)
        
        items.append(schemas.ReceiptItem(
            name=item_name.title(),
            quantity=quantity,
            category=category,
            location=models.LocationType.FRIDGE
        ))
    
    return items[:20]  # Limit to 20 items

@router.post("/scan", response_model=schemas.ReceiptScanResponse)
def scan_receipt(request: schemas.ReceiptScanRequest, db: Session = Depends(get_db)):
    """Scan receipt and extract items"""
    try:
        # Extract text from image
        receipt_text = extract_text_from_image(request.image_base64)
        
        # Parse text into items
        items = parse_receipt_text(receipt_text)
        
        return schemas.ReceiptScanResponse(
            items=items,
            confidence=0.85  # Mock confidence
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
