from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
from openai import OpenAI
from app.database import get_db
from app import models, schemas
from app.expiration_db import get_color_code
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

DEFAULT_USER_ID = 1

def get_user_fridge_items(db: Session) -> List[dict]:
    """Get current fridge items for SPOY context"""
    items = db.query(models.Item).filter(
        models.Item.user_id == DEFAULT_USER_ID,
        models.Item.consumed == False,
        models.Item.expiration_date > datetime.now()
    ).all()
    
    return [{
        "name": item.name,
        "category": item.category.value if hasattr(item.category, 'value') else str(item.category),
        "expiration_date": item.expiration_date.isoformat(),
        "days_left": (item.expiration_date - datetime.now()).days
    } for item in items]

def get_expiring_soon_items(db: Session, days: int = 3) -> List[dict]:
    """Get items expiring within specified days"""
    cutoff_date = datetime.now() + timedelta(days=days)
    items = db.query(models.Item).filter(
        models.Item.user_id == DEFAULT_USER_ID,
        models.Item.consumed == False,
        models.Item.expiration_date <= cutoff_date,
        models.Item.expiration_date >= datetime.now()
    ).all()
    
    return [{
        "name": item.name,
        "category": item.category.value if hasattr(item.category, 'value') else str(item.category),
        "expiration_date": item.expiration_date.isoformat(),
        "days_left": (item.expiration_date - datetime.now()).days
    } for item in items]

@router.get("/auto-recommend", response_model=schemas.SPOYResponse)
def get_auto_recommendations(db: Session = Depends(get_db)):
    """Automatically get recipe recommendations for expiring items"""
    try:
        # Get items expiring soon
        expiring_soon = get_expiring_soon_items(db, days=3)
        
        if not expiring_soon:
            return schemas.SPOYResponse(
                response="Great news! You don't have any items expiring in the next 3 days. Your fridge is looking good! 🎉",
                suggested_items=[]
            )
        
        # Get all fridge items for context
        fridge_items = get_user_fridge_items(db)
        
        # Build context
        expiring_names = [item["name"] for item in expiring_soon]
        expiring_list = ", ".join(expiring_names)
        items_list = ", ".join([item["name"] for item in fridge_items])
        
        # Create auto-recommendation prompt
        auto_prompt = f"""You have {len(expiring_soon)} items expiring soon: {expiring_list}

Here are some recipes to help you use them up:

"""
        
        system_prompt = f"""You are SPOY, a helpful AI assistant for the Spoiler Alert app. 
Your role is to suggest recipes based on what the user has in their fridge, especially items that are expiring soon.

Current items in fridge: {items_list}
Items expiring soon (less than 3 days): {expiring_list}

Provide helpful, quick recipe suggestions that use the items expiring soon. Prioritize recipes that use multiple expiring items together.
Keep responses concise and friendly. Format as a helpful message starting with acknowledging the expiring items, then provide 2-3 recipe suggestions."""

        # Call OpenAI API
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Mock response for MVP if API key not set
            return schemas.SPOYResponse(
                response=f"You have {len(expiring_soon)} items expiring soon: {expiring_list}\n\nHere are some quick recipe ideas:\n1. Use {expiring_names[0]} in a stir-fry or salad\n2. Combine {expiring_names[0]} with other ingredients for a quick meal\n3. Make a simple dish using {expiring_names[0]}\n\nNote: OpenAI API key not configured. Set OPENAI_API_KEY for AI-powered recommendations.",
                suggested_items=expiring_names[:3]
            )
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": auto_prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Save conversation
        conversation = models.SPOYConversation(
            user_id=DEFAULT_USER_ID,
            message="Auto-recommendation",
            response=ai_response
        )
        db.add(conversation)
        db.commit()
        
        return schemas.SPOYResponse(
            response=ai_response,
            suggested_items=expiring_names[:3]
        )
    except Exception as e:
        # Fallback response
        expiring_soon = get_expiring_soon_items(db, days=3)
        expiring_names = [item["name"] for item in expiring_soon] if expiring_soon else []
        return schemas.SPOYResponse(
            response=f"I'm having trouble right now. Error: {str(e)}. Please try again!",
            suggested_items=expiring_names[:3]
        )

@router.post("/chat", response_model=schemas.SPOYResponse)
def chat_with_spoy(message: schemas.SPOYMessage, db: Session = Depends(get_db)):
    """Chat with SPOY AI assistant for recipe recommendations"""
    try:
        # Get user's current fridge items
        fridge_items = get_user_fridge_items(db)
        
        # Find items expiring soon
        expiring_soon = [item for item in fridge_items if item["days_left"] < 3]
        
        # Build context for OpenAI
        items_list = ", ".join([item["name"] for item in fridge_items])
        expiring_list = ", ".join([item["name"] for item in expiring_soon]) if expiring_soon else "none"
        
        system_prompt = f"""You are SPOY, a helpful AI assistant for the Spoiler Alert app. 
Your role is to suggest recipes based on what the user has in their fridge, especially items that are expiring soon.

Current items in fridge: {items_list}
Items expiring soon (less than 3 days): {expiring_list}

Provide helpful, quick recipe suggestions that use the items the user has, prioritizing items that are expiring soon.
Keep responses concise and friendly. If the user asks about items not in their fridge, politely let them know."""

        # Call OpenAI API
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Mock response for MVP if API key not set
            return schemas.SPOYResponse(
                response="I'd be happy to help! However, the OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.",
                suggested_items=[item["name"] for item in expiring_soon[:3]]
            )
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message.message}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Save conversation
        conversation = models.SPOYConversation(
            user_id=DEFAULT_USER_ID,
            message=message.message,
            response=ai_response
        )
        db.add(conversation)
        db.commit()
        
        return schemas.SPOYResponse(
            response=ai_response,
            suggested_items=[item["name"] for item in expiring_soon[:3]]
        )
    except Exception as e:
        # Fallback response
        return schemas.SPOYResponse(
            response=f"I'm having trouble right now. Error: {str(e)}. Please try again!",
            suggested_items=[]
        )

@router.get("/history")
def get_spoy_history(db: Session = Depends(get_db), limit: int = 10):
    """Get SPOY conversation history"""
    conversations = db.query(models.SPOYConversation).filter(
        models.SPOYConversation.user_id == DEFAULT_USER_ID
    ).order_by(models.SPOYConversation.created_at.desc()).limit(limit).all()
    
    return [{
        "id": c.id,
        "message": c.message,
        "response": c.response,
        "created_at": c.created_at.isoformat()
    } for c in conversations]
