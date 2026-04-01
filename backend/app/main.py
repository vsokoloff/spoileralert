"""
backend/app/main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base
from app.routers import items, categories, receipt, spoy, users, notifications, roommates

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Spoiler Alert API", version="1.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
# Always allow localhost for development.
# In production, set FRONTEND_URL to your Vercel URL — wildcard is NOT used.
_frontend_url = os.getenv("FRONTEND_URL", "").strip()

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
if _frontend_url:
    allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(users.router,         prefix="/api/users",         tags=["users"])
app.include_router(items.router,         prefix="/api/items",         tags=["items"])
app.include_router(categories.router,    prefix="/api/categories",    tags=["categories"])
app.include_router(receipt.router,       prefix="/api/receipt",       tags=["receipt"])
app.include_router(spoy.router,          prefix="/api/spoy",          tags=["spoy"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(roommates.router,     prefix="/api/roommates",     tags=["roommates"])


@app.get("/")
async def root():
    return {"message": "Spoiler Alert API"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}
