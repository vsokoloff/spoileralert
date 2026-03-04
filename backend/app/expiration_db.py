"""
Expiration date database based on food storage guidelines.
This provides default shelf life for common food items.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.models import CategoryType, LocationType

# Default shelf life in days for common foods
# Format: {food_name_lower: days}
EXPIRATION_DATABASE: Dict[str, int] = {
    # Produce
    "apple": 30,
    "banana": 7,
    "orange": 14,
    "lettuce": 7,
    "spinach": 5,
    "carrot": 21,
    "tomato": 7,
    "onion": 60,
    "potato": 30,
    "broccoli": 7,
    "cauliflower": 7,
    "cucumber": 7,
    "bell pepper": 7,
    "mushroom": 7,
    "avocado": 5,
    "strawberry": 5,
    "blueberry": 7,
    "grapes": 7,
    
    # Eggs & Dairy
    "milk": 7,
    "eggs": 21,
    "cheese": 14,
    "feta": 7,
    "yogurt": 14,
    "butter": 30,
    "cream": 7,
    "sour cream": 14,
    "cottage cheese": 7,
    
    # Meat
    "chicken": 2,
    "beef": 3,
    "pork": 3,
    "fish": 2,
    "salmon": 2,
    "ground beef": 2,
    "turkey": 2,
    "bacon": 7,
    "sausage": 2,
    
    # Deli
    "deli meat": 5,
    "ham": 5,
    "turkey breast": 5,
    "salami": 7,
    
    # Shelf Staples/Grains
    "rice": 180,  # 6 months
    "pasta": 365,  # 1 year
    "flour": 365,
    "sugar": 730,  # 2 years
    "bread": 7,
    "cereal": 180,
    "oats": 365,
    
    # Leftovers
    "leftover": 3,
    "cooked meal": 3,
}

# Category mappings for auto-categorization
CATEGORY_KEYWORDS: Dict[CategoryType, list] = {
    CategoryType.PRODUCE: ["apple", "banana", "orange", "lettuce", "spinach", "carrot", "tomato", 
                           "onion", "potato", "broccoli", "cauliflower", "cucumber", "pepper",
                           "mushroom", "avocado", "strawberry", "blueberry", "grape", "fruit", "vegetable"],
    CategoryType.EGGS_DAIRY: ["milk", "egg", "cheese", "feta", "yogurt", "butter", "cream", "dairy"],
    CategoryType.MEAT: ["chicken", "beef", "pork", "fish", "salmon", "turkey", "bacon", "sausage", "meat"],
    CategoryType.DELI: ["deli", "ham", "salami", "turkey breast", "cold cut"],
    CategoryType.PANTRY: ["rice", "pasta", "flour", "sugar", "bread", "cereal", "oats", "grain"],
    CategoryType.LEFTOVERS: ["leftover", "cooked", "meal"],
}

def get_expiration_date(item_name: str, purchase_date: Optional[datetime] = None, 
                       location: LocationType = LocationType.FRIDGE) -> datetime:
    """
    Calculate expiration date based on item name and location.
    Returns expiration date as datetime.
    """
    if purchase_date is None:
        purchase_date = datetime.now()
    
    item_lower = item_name.lower()
    
    # Check for exact match
    shelf_life_days = None
    for key, days in EXPIRATION_DATABASE.items():
        if key in item_lower:
            shelf_life_days = days
            break
    
    # Default shelf life if not found
    if shelf_life_days is None:
        # Default based on category
        shelf_life_days = 7  # Default 7 days
    
    # Adjust for location
    if location == LocationType.FREEZER:
        shelf_life_days *= 3  # Freezer extends shelf life 3x
    elif location == LocationType.PANTRY:
            # Shelf Staples items typically last longer
        if shelf_life_days < 30:
            shelf_life_days = 30  # Minimum 30 days for pantry
    
    expiration_date = purchase_date + timedelta(days=shelf_life_days)
    return expiration_date

def categorize_item(item_name: str) -> CategoryType:
    """
    Auto-categorize item based on name.
    """
    item_lower = item_name.lower()
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in item_lower:
                return category
    
    # Default to Produce if unknown
    return CategoryType.PRODUCE

def get_color_code(expiration_date: datetime, location: LocationType) -> str:
    """
    Get color code based on expiration date and location.
    Returns: 'red', 'yellow', 'green', 'blue', or 'black'
    """
    now = datetime.now()
    days_until_expiry = (expiration_date - now).days
    
    if location == LocationType.FREEZER:
        return "blue"
    
    if location == LocationType.PANTRY and days_until_expiry > 90:
        return "black"
    
    if days_until_expiry < 0:
        return "red"  # Expired
    elif days_until_expiry < 3:
        return "red"
    elif days_until_expiry < 7:
        return "yellow"
    else:
        return "green"
