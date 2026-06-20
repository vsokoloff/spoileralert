"""
Backend API tests.

These run against an isolated, temporary SQLite database so they never touch
real data. Every items endpoint now requires authentication, so the suite
registers a user, grabs a JWT, and sends it with each request.
"""

import os
import tempfile

# ── Isolate the database BEFORE the app is imported ──────────────────────────────
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def _setup_database():
    """Create a fresh schema for the test module, then clean up the temp file."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(_db_path):
        os.remove(_db_path)


@pytest.fixture(scope="module")
def auth_headers():
    """Register a test user and return an Authorization header with the JWT."""
    resp = client.post(
        "/api/users/register",
        json={"name": "Tester", "email": "tester@example.com", "password": "pw123456"},
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_items_require_auth():
    """Unauthenticated requests should be rejected."""
    response = client.get("/api/items/")
    assert response.status_code == 401


def test_get_items(auth_headers):
    response = client.get("/api/items/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_item(auth_headers):
    item_data = {
        "name": "Test Milk",
        "expiration_date": "2030-12-31T00:00:00",
        "quantity": 1.0,
        "category": "Eggs & Dairy",
        "location": "fridge",
        "consumed": False,
    }
    response = client.post("/api/items/", json=item_data, headers=auth_headers)
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Test Milk"


def test_get_item_by_id(auth_headers):
    item_data = {
        "name": "Test Item",
        "expiration_date": "2030-12-31T00:00:00",
        "quantity": 1.0,
        "category": "Produce",
        "location": "fridge",
        "consumed": False,
    }
    create_response = client.post("/api/items/", json=item_data, headers=auth_headers)
    assert create_response.status_code == 201, create_response.text
    item_id = create_response.json()["id"]

    response = client.get(f"/api/items/{item_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == item_id


def test_categories_scoped_to_user(auth_headers):
    """Categories must require auth (regression test for the user_id=1 leak)."""
    assert client.get("/api/categories/").status_code == 401
    response = client.get("/api/categories/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
