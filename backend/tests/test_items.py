import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_items():
    """Test getting all items"""
    response = client.get("/api/items")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_item():
    """Test creating an item"""
    item_data = {
        "name": "Test Milk",
        "expiration_date": "2024-12-31T00:00:00",
        "quantity": 1.0,
        "category": "Eggs & Dairy",
        "location": "fridge",
        "consumed": False
    }
    response = client.post("/api/items", json=item_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Milk"

def test_get_item_by_id():
    """Test getting item by ID"""
    # First create an item
    item_data = {
        "name": "Test Item",
        "expiration_date": "2024-12-31T00:00:00",
        "quantity": 1.0,
        "category": "Produce",
        "location": "fridge",
        "consumed": False
    }
    create_response = client.post("/api/items", json=item_data)
    item_id = create_response.json()["id"]
    
    # Then get it
    response = client.get(f"/api/items/{item_id}")
    assert response.status_code == 200
    assert response.json()["id"] == item_id
