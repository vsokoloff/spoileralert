"""
Expiration date database based on the Food Storage and Color Coding reference sheet.
"""

import os
import re
import json
from openai import OpenAI
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Optional, Dict
from app.models import CategoryType, LocationType


def _normalize_name(name: str) -> str:
    """Normalize item name for database lookup."""
    s = name.lower().strip()
    s = re.sub(r'\s*\(.*?\)', '', s).strip()
    if s.endswith('ies'):
        s = s[:-3] + 'y'
    elif s.endswith('ves'):
        s = s[:-3] + 'f'
    elif s.endswith('s') and not s.endswith('ss'):
        s = s[:-1]
    return s


# --- STATIC DATABASE ARRAYS ---
# (Your massive lists of items stay exactly the same here to handle 90% of requests instantly and for free)
EXPIRATION_DATABASE: Dict[str, int] = {
    # PRO_01 Leafy Greens & Herbs — 5 days
    "lettuce": 5, "spinach": 5, "arugula": 5, "kale": 5,
    "basil": 5, "cilantro": 5, "parsley": 5, "mint": 5,
    "chard": 5, "collard": 5, "herb": 5,
    "strawberry": 3, "blueberry": 3, "blackberry": 3, "raspberry": 3,
    "apple": 21, "pear": 21, "grape": 21, "cherry": 21, "fig": 21, "nectarine": 21,
    "orange": 14, "clementine": 14, "lemon": 14, "lime": 14, "grapefruit": 14, "mandarin": 14,
    "carrot": 21, "beet": 21, "turnip": 21, "parsnip": 21, "radish": 21, "ginger": 21,
    "onion": 60, "garlic": 60, "potato": 30, "sweet potato": 30, "shallot": 30,
    "tomato": 4, "cucumber": 4, "eggplant": 4, "zucchini": 4, "squash": 4, "corn": 2,
    "broccoli": 4, "cauliflower": 4, "brussels sprout": 4, "brussels": 4,
    "cabbage": 10, "celery": 10, "asparagus": 4, "mushroom": 2,
    "pepper": 10, "bell pepper": 10, "chili pepper": 10,
    "green bean": 4, "beans green": 4, "string bean": 4, "snap pea": 4,
    "melon": 7, "watermelon": 7, "cantaloupe": 7, "honeydew": 7,
    "avocado": 3, "banana": 7, "mango": 4, "pineapple": 4,
    "peach": 3, "plum": 3, "apricot": 3,

    "milk": 7, "cream": 7, "heavy cream": 7, "half and half": 7, "buttermilk": 7,
    "mozzarella": 10, "feta": 10, "brie": 10, "ricotta": 10,
    "cottage cheese": 10, "cream cheese": 10, "goat cheese": 10,
    "cheddar": 60, "parmesan": 60, "parm": 60, "gouda": 60,
    "swiss cheese": 60, "swiss": 60, "provolone": 60, "romano": 60,
    "egg": 28,
    "oat milk": 8, "almond milk": 8, "soy milk": 8, "coconut milk": 8,
    "nut milk": 8, "plant milk": 8, "cashew milk": 8, "macadamia milk": 8,
    "yogurt": 14, "greek yogurt": 14, "butter": 30, "sour cream": 14, "kefir": 14,

    "ground beef": 2, "ground turkey": 2, "ground pork": 2, "ground chicken": 2, "ground meat": 2,
    "chicken": 2, "turkey": 2, "duck": 2, "chicken breast": 2, "chicken thigh": 2, "chicken wing": 2,
    "beef": 4, "steak": 4, "pork": 4, "pork chop": 4, "lamb": 4, "veal": 4, "roast": 4,
    "cod": 2, "tilapia": 2, "halibut": 2, "tuna": 2,
    "salmon": 2, "mackerel": 2, "sardine": 2, "trout": 2,
    "shrimp": 2, "crab": 2, "lobster": 2, "clam": 2, "scallop": 2, "oyster": 2,
    "bacon": 10, "sausage": 10, "hot dog": 10, "pepperoni": 10,

    "deli meat": 5, "ham": 5, "turkey breast": 5, "salami": 5,
    "prosciutto": 5, "roast beef": 5, "pastrami": 5, "hummus": 5,
    "tofu": 7, "tempeh": 7, "seitan": 7, "guacamole": 3,

    "juice": 14, "orange juice": 14, "apple juice": 14, "lemonade": 14,
    "soda": 365, "water": 730, "sparkling water": 365, "kombucha": 30,
    "coffee": 365, "tea": 365, "beer": 180, "wine": 5,

    "mayonnaise": 60, "mayo": 60, "salad dressing": 90, "bbq sauce": 120,
    "salsa": 14, "relish": 180, "syrup": 365, "maple syrup": 365, "hot sauce": 365,
    "ketchup": 180, "mustard": 365, "soy sauce": 365, "jam": 180, "jelly": 180,
    "peanut butter": 365, "almond butter": 365,

    "chips": 60, "popcorn": 180, "nuts": 180, "almond": 180, "walnut": 180,
    "peanut": 180, "seeds": 180, "pretzels": 60, "chocolate": 365, "cracker": 90,

    "canned tomato": 365, "canned fruit": 365, "canned peach": 365,
    "canned bean": 730, "canned corn": 730, "canned soup": 730,
    "canned vegetable": 730, "canned meat": 730,

    "broth": 7, "stock": 7, "chicken broth": 7, "beef broth": 7, "vegetable broth": 7,

    "rice": 730, "pasta": 730, "oat": 730, "oatmeal": 730,
    "brown rice": 730, "quinoa": 730, "flour": 365, "cereal": 270,

    "sugar": 730, "salt": 730, "baking powder": 270, "baking soda": 270,
    "olive oil": 365, "vegetable oil": 365, "vinegar": 730, "honey": 730,

    "bread": 21, "bagel": 14, "tortilla": 14,

    "leftover": 3, "cooked rice": 4, "cooked pasta": 4, "cooked meat": 4,
    "cooked poultry": 4, "cooked soup": 4, "cooked stew": 4,
    "pizza": 4, "casserole": 4, "cooked": 4, "prepared": 4, "meal prep": 4,
}

CATEGORY_KEYWORDS: Dict[CategoryType, list] = {
    CategoryType.PRODUCE: [
        "apple", "pear", "grape", "cherry", "fig", "nectarine", "guacamole",
        "orange", "lemon", "lime", "clementine", "grapefruit", "mandarin",
        "strawberry", "blueberry", "blackberry", "raspberry", "berry",
        "lettuce", "spinach", "arugula", "kale", "basil", "cilantro",
        "parsley", "mint", "chard", "collard", "herb", "celery", "cabbage",
        "carrot", "beet", "turnip", "parsnip", "radish", "ginger",
        "onion", "garlic", "potato", "sweet potato", "shallot",
        "tomato", "cucumber", "eggplant", "zucchini", "squash", "corn",
        "broccoli", "cauliflower", "brussels", "cabbage", "celery",
        "asparagus", "mushroom", "pepper", "green bean", "snap pea",
        "melon", "watermelon", "cantaloupe", "honeydew",
        "avocado", "banana", "mango", "pineapple", "peach", "plum",
        "apricot", "produce", "fruit", "vegetable", "veggie",
    ],
    CategoryType.EGGS_DAIRY: [
        "milk", "cream", "buttermilk", "half and half",
        "mozzarella", "feta", "brie", "ricotta", "cottage cheese",
        "cream cheese", "goat cheese", "cheddar", "parmesan", "parm",
        "gouda", "swiss", "provolone", "romano",
        "egg", "yogurt", "greek yogurt", "butter", "sour cream", "kefir",
        "oat milk", "almond milk", "soy milk", "coconut milk", "nut milk", "plant milk",
        "dairy", "cheese",
    ],
    CategoryType.MEAT: [
        "ground beef", "ground turkey", "ground pork", "ground chicken",
        "chicken", "turkey", "duck",
        "beef", "steak", "pork", "lamb", "veal", "roast",
        "cod", "tilapia", "halibut", "tuna", "salmon", "mackerel",
        "sardine", "trout", "shrimp", "crab", "lobster", "clam",
        "scallop", "oyster", "fish", "seafood", "meat", "poultry",
    ],
    CategoryType.DELI: [
        "deli", "ham", "turkey breast", "salami", "prosciutto",
        "roast beef", "pastrami", "hummus", "hot dog", "pepperoni",
        "cold cut", "tofu", "tempeh", "seitan",
    ],
    CategoryType.PANTRY: [
        "rice", "pasta", "oat", "quinoa", "flour", "cereal",
        "sugar", "salt", "honey", "jam", "jelly", "peanut butter",
        "almond butter", "ketchup", "mustard", "hot sauce", "soy sauce",
        "olive oil", "vegetable oil", "vinegar", "bread", "bagel",
        "tortilla", "cracker", "canned", "bean", "lentil", "grain",
        "baking", "spice", "condiment", "juice", "soda", "water", 
        "tea", "coffee", "wine", "beer", "mayonnaise", "mayo", 
        "salad dressing", "bbq sauce", "salsa", "relish", "syrup", 
        "chips", "popcorn", "nuts", "almond", "walnut", "peanut", 
        "seed", "pretzel", "chocolate", "broth", "stock", "kombucha"
    ],
    CategoryType.FREEZER: [
        "frozen", "ice cream", "tv dinner", "chicken nugget",
        "waffle", "pancake",
    ],
    CategoryType.LEFTOVERS: [
        "leftover", "cooked", "casserole", "stew", "prepared", "meal prep"
    ],
}

CATEGORY_DEFAULT_DAYS: Dict[CategoryType, int] = {
    CategoryType.PRODUCE:    5,    
    CategoryType.EGGS_DAIRY: 7,    
    CategoryType.MEAT:       2,    
    CategoryType.DELI:       4,    
    CategoryType.PANTRY:     365,  
    CategoryType.FREEZER:    90,   
    CategoryType.LEFTOVERS:  3,    
}


# --- NEW: AI RAG-LITE APPROXIMATION ---
@lru_cache(maxsize=100)
def analyze_unknown_item_with_llm(item_name: str) -> dict:
    """
    If an item isn't in our hardcoded lists, ask OpenAI to approximate it 
    based strictly on our database's exact shelf-life rules.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"category": None, "shelf_life_days": None}

    try:
        client = OpenAI(api_key=api_key, timeout=10.0, max_retries=1)

        # We inject our specific database rules as the "context" for the LLM
        system_prompt = """You are an AI data categorizer for a food inventory app.
        The user will provide a food item name. You must approximate what it is, categorize it, and provide the fridge shelf life based STRICTLY on these database rules:

        DATABASE RULES:
        - Leftovers / Cooked Meals / Sandwiches / Prepared Food: 3-4 days (Category: Leftovers)
        - Ground Meats / Minced Meat (Beef, Turkey, Pork): 2 days (Category: Meat)
        - Fresh Poultry / Fish / Seafood: 2 days (Category: Meat)
        - Steaks / Chops / Roasts: 4 days (Category: Meat)
        - Deli Meats / Sliced Meats: 5 days (Category: Deli)
        - Leafy Greens / Herbs: 5 days (Category: Produce)
        - Soft Berries: 3 days (Category: Produce)
        - Hard Fruits (Apples, Pears) / Root Veggies: 21 days (Category: Produce)
        - Citrus Fruits: 14 days (Category: Produce)
        - Liquid Dairy (Milk, Cream) / Plant Milks: 7 days (Category: Eggs & Dairy)
        - Soft Cheese / Yogurt: 10-14 days (Category: Eggs & Dairy)
        - Hard Cheese (Parmesan, Cheddar): 60 days (Category: Eggs & Dairy)
        - Eggs: 28 days (Category: Eggs & Dairy)
        - Condiments / Dry Goods / Pantry staples: 365 days (Category: Pantry)
        - Frozen Foods: 90 days (Category: Freezer)

        Respond ONLY in valid JSON format matching this schema:
        {
          "category": "Produce" | "Eggs & Dairy" | "Meat" | "Deli" | "Pantry" | "Freezer" | "Leftovers",
          "shelf_life_days": <integer>
        }"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Item: {item_name}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return {
            "category": result.get("category"),
            "shelf_life_days": result.get("shelf_life_days")
        }
    except Exception as e:
        print(f"LLM Classification Error for '{item_name}': {e}")
        return {"category": None, "shelf_life_days": None}


def categorize_item(item_name: str) -> CategoryType:
    """Auto-categorize item by matching name against keyword lists, with AI fallback."""
    normalized = _normalize_name(item_name)
    item_lower = item_name.lower()

    # 1. Hardcoded exact/substring matches (Fast & Free)
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized or keyword in item_lower:
                return category

    # 2. AI Semantic Routing Fallback
    llm_result = analyze_unknown_item_with_llm(item_name)
    if llm_result.get("category"):
        cat_str = llm_result["category"].lower()
        # Map the AI string safely back to your exact Database Enum Types
        for cat_enum in CategoryType:
            if cat_enum.value.lower() == cat_str or (cat_str == "eggs & dairy" and cat_enum == CategoryType.EGGS_DAIRY):
                return cat_enum

    return CategoryType.PRODUCE


def get_expiration_date(item_name: str, purchase_date: Optional[datetime] = None,
                        location: LocationType = LocationType.FRIDGE) -> datetime:
    """Calculate expiration date using exact lookup, generic fallbacks, and AI approximation."""
    if purchase_date is None:
        purchase_date = datetime.now()

    normalized = _normalize_name(item_name)
    item_lower = item_name.lower().strip()

    shelf_life_days = None

    # 1. Try normalized name first
    for key, days in EXPIRATION_DATABASE.items():
        if key in normalized or normalized in key:
            shelf_life_days = days
            break

    # 2. Fall back to raw lowercase name
    if shelf_life_days is None:
        for key, days in EXPIRATION_DATABASE.items():
            if key in item_lower or item_lower in key:
                shelf_life_days = days
                break
                
    # 3. Simple Generic Fallbacks
    if shelf_life_days is None:
        if "cooked" in item_lower or "leftover" in item_lower or "prepared" in item_lower:
            shelf_life_days = 4 
        elif "milk" in item_lower:
            shelf_life_days = 7 
        elif "cheese" in item_lower:
            shelf_life_days = 10 
        elif "meat" in item_lower or "beef" in item_lower or "chicken" in item_lower:
            shelf_life_days = 3 
        elif "juice" in item_lower:
            shelf_life_days = 14 

    # 4. AI Semantic Routing Fallback
    # (If categorize_item already called this, @lru_cache returns the answer instantly)
    if shelf_life_days is None:
        llm_result = analyze_unknown_item_with_llm(item_name)
        if llm_result.get("shelf_life_days"):
            shelf_life_days = llm_result["shelf_life_days"]

    # 5. Ultimate Fallback (If AI fails or API key is broken)
    if shelf_life_days is None:
        guessed_category = categorize_item(item_name)
        shelf_life_days = CATEGORY_DEFAULT_DAYS.get(guessed_category, 5)

    # Location adjustments (Freezer extends life 4x)
    if location == LocationType.FREEZER:
        shelf_life_days = max(shelf_life_days * 4, 90)
    elif location == LocationType.PANTRY and shelf_life_days < 14:
        shelf_life_days = 30

    return purchase_date + timedelta(days=shelf_life_days)


def get_color_code(expiration_date: datetime, location: LocationType) -> str:
    """Simplified color system: green / yellow / red only."""
    now = datetime.now()
    days_until_expiry = (expiration_date - now).days
    if days_until_expiry < 3:
        return "red"
    elif days_until_expiry < 7:
        return "yellow"
    else:
        return "green"