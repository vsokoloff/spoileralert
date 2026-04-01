"""
backend/app/routers/spoy.py

Uses Google Gemini (free tier) instead of OpenAI.

Setup:
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key" (free, no billing required)
3. Add to your .env:
       GEMINI_API_KEY=your_key_here
4. Add to requirements.txt:
       google-genai
"""

import os
from datetime import datetime, timedelta
from typing import List

from google import genai
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()

GEMINI_MODEL = "gemini-1.5-flash"


# ── Gemini setup ───────────────────────────────────────────────────────────────

def _get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


# ── Fridge helpers ─────────────────────────────────────────────────────────────

def _fridge_items(user_id: int, db: Session) -> List[dict]:
    items = db.query(models.Item).filter(
        models.Item.user_id == user_id,
        models.Item.consumed == False,
        models.Item.expiration_date > datetime.now(),
    ).all()
    return [
        {
            "name": item.name,
            "category": item.category.value if hasattr(item.category, "value") else str(item.category),
            "expiration_date": item.expiration_date.isoformat(),
            "days_left": (item.expiration_date - datetime.now()).days,
        }
        for item in items
    ]


def _expiring_soon(user_id: int, db: Session, days: int = 3) -> List[dict]:
    cutoff = datetime.now() + timedelta(days=days)
    items = db.query(models.Item).filter(
        models.Item.user_id == user_id,
        models.Item.consumed == False,
        models.Item.expiration_date <= cutoff,
        models.Item.expiration_date >= datetime.now(),
    ).all()
    return [
        {
            "name": item.name,
            "category": item.category.value if hasattr(item.category, "value") else str(item.category),
            "expiration_date": item.expiration_date.isoformat(),
            "days_left": (item.expiration_date - datetime.now()).days,
        }
        for item in items
    ]


def _build_prompt(items_list: str, expiring_list: str, user_message: str) -> str:
    return f"""You are SPOY, a helpful AI kitchen assistant for the Spoiler Alert app.
Your job is to suggest recipes based on what the user has in their fridge, especially items expiring soon.

Current fridge contents: {items_list or "nothing"}
Expiring within 3 days: {expiring_list or "none"}

Rules:
1. Only suggest recipes using the ingredients listed above.
2. Prioritise items expiring soon.
3. If there are not enough ingredients for a full meal, say so and suggest the best option available.
4. Politely decline any question not related to food, cooking, or fridge inventory.
5. Keep responses concise and friendly.

User: {user_message}"""


def _save_conversation(user_id: int, message: str, response: str, db: Session):
    db.add(models.SPOYConversation(user_id=user_id, message=message, response=response))
    db.commit()


def _call_gemini(client, prompt: str) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    return response.text


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/auto-recommend", response_model=schemas.SPOYResponse)
def get_auto_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Automatically suggest recipes for items expiring soon."""
    expiring = _expiring_soon(current_user.id, db)

    if not expiring:
        return schemas.SPOYResponse(
            response="Great news! You don't have any items expiring in the next 3 days. Your fridge is looking good! 🎉",
            suggested_items=[],
        )

    fridge = _fridge_items(current_user.id, db)
    expiring_names = [i["name"] for i in expiring]
    items_list = ", ".join(i["name"] for i in fridge)
    expiring_list = ", ".join(expiring_names)

    client = _get_client()
    if not client:
        return schemas.SPOYResponse(
            response=(
                f"You have {len(expiring)} item(s) expiring soon: {expiring_list}.\n\n"
                "Set GEMINI_API_KEY in your .env to get AI-powered recipe suggestions!"
            ),
            suggested_items=expiring_names[:3],
        )

    try:
        prompt = _build_prompt(
            items_list,
            expiring_list,
            f"I have {len(expiring)} item(s) expiring soon: {expiring_list}. Please suggest recipes to use them up."
        )
        ai_response = _call_gemini(client, prompt)
        _save_conversation(current_user.id, "Auto-recommendation", ai_response, db)
        return schemas.SPOYResponse(response=ai_response, suggested_items=expiring_names[:3])

    except Exception as e:
        return schemas.SPOYResponse(
            response=f"I'm having trouble right now ({e}). Please try again!",
            suggested_items=expiring_names[:3],
        )


@router.post("/chat", response_model=schemas.SPOYResponse)
def chat_with_spoy(
    message: schemas.SPOYMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Chat with SPOY for recipe recommendations."""
    fridge = _fridge_items(current_user.id, db)
    expiring = [i for i in fridge if i["days_left"] < 3]
    items_list = ", ".join(i["name"] for i in fridge)
    expiring_list = ", ".join(i["name"] for i in expiring)

    client = _get_client()
    if not client:
        return schemas.SPOYResponse(
            response="GEMINI_API_KEY is not configured. Add it to your .env to enable SPOY.",
            suggested_items=[i["name"] for i in expiring[:3]],
        )

    try:
        prompt = _build_prompt(items_list, expiring_list, message.message)
        ai_response = _call_gemini(client, prompt)
        _save_conversation(current_user.id, message.message, ai_response, db)
        return schemas.SPOYResponse(
            response=ai_response,
            suggested_items=[i["name"] for i in expiring[:3]],
        )

    except Exception as e:
        return schemas.SPOYResponse(
            response=f"I'm having trouble right now ({e}). Please try again!",
            suggested_items=[],
        )


@router.get("/history")
def get_spoy_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return SPOY conversation history for the current user."""
    conversations = (
        db.query(models.SPOYConversation)
        .filter(models.SPOYConversation.user_id == current_user.id)
        .order_by(models.SPOYConversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "message": c.message,
            "response": c.response,
            "created_at": c.created_at.isoformat(),
        }
        for c in conversations
    ]
