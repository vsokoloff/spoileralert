"""
Expiration date database based on the Food Storage and Color Coding reference sheet.
Each item maps to a Rule_ID cluster from the spreadsheet, with fridge life used
as the primary shelf life (mid-point of ranges where applicable).

Color rule per TA feedback: green / yellow / red only.
Freezer and Pantry items use the same dynamic color system.

Rule_ID reference (fridge life in days):
  GEN_PRO = 5    GEN_MEA = 2    GEN_DAI = 7    GEN_DEL = 4    GEN_LEF = 3
  PRO_01 = 5     PRO_02 = 3     PRO_03 = 21    PRO_04 = 14    PRO_05 = 21
  PRO_06 = pantry only (do not refrigerate)
  PRO_07 = 4     PRO_08 = 4     PRO_09 = 7
  DAI_01 = 7     DAI_02 = 10    DAI_03 = 60    DAI_04 = 28    DAI_05 = 8
  MEA_01 = 2     MEA_02 = 2     MEA_03 = 4     MEA_04 = 2     MEA_05 = 2
  MEA_06 = 2     MEA_07 = 10
  DEL_01 = 5
  PAN_01–06 = pantry items (no fridge life unless opened)
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from app.models import CategoryType, LocationType


# ---------------------------------------------------------------------------
# Shelf life in days (fridge life = primary reference from spreadsheet)
# ---------------------------------------------------------------------------
EXPIRATION_DATABASE: Dict[str, int] = {

    # ── Produce: PRO_01 Leafy Greens & Herbs (5 days) ──
    "lettuce": 5,
    "spinach": 5,
    "arugula": 5,
    "kale": 5,
    "basil": 5,
    "cilantro": 5,
    "parsley": 5,
    "mint": 5,
    "chard": 5,
    "collard": 5,

    # ── Produce: PRO_02 Soft Berries (3 days) ──
    "strawberry": 3,
    "blueberry": 3,
    "blackberry": 3,
    "raspberry": 3,

    # ── Produce: PRO_03 Hard Fruits (21 days) ──
    "apple": 21,
    "pear": 21,
    "grapes": 21,
    "grape": 21,
    "cherry": 21,
    "fig": 21,
    "nectarine": 21,

    # ── Produce: PRO_04 Citrus Fruits (14 days) ──
    "orange": 14,
    "clementine": 14,
    "lemon": 14,
    "lime": 14,
    "grapefruit": 14,
    "mandarin": 14,

    # ── Produce: PRO_05 Root Vegetables (21 days) ──
    "carrot": 21,
    "beet": 21,
    "turnip": 21,
    "parsnip": 21,
    "radish": 21,
    "ginger": 21,

    # ── Produce: PRO_06 Counter Veggies — pantry only, do not refrigerate ──
    # These are stored with pantry life. If refrigerated, fridge life applies
    # but the spreadsheet says "do not refrigerate" so we use pantry defaults.
    "onion": 60,       # pantry ~1-2 months
    "garlic": 60,      # pantry ~1-2 months
    "potato": 30,      # pantry ~1 month
    "sweet potato": 30,
    "shallot": 30,

    # ── Produce: PRO_07 Fleshy Veggies / Nightshades (4 days) ──
    "tomato": 4,
    "cucumber": 4,
    "eggplant": 4,
    "zucchini": 4,
    "squash": 4,
    "corn": 2,         # corn in husk = 1-2 days per spreadsheet

    # ── Produce: PRO_08 Cruciferous Veggies (4 days) ──
    "broccoli": 4,
    "cauliflower": 4,
    "brussels sprouts": 4,
    "brussels": 4,
    "cabbage": 10,     # spreadsheet notes 1-2 weeks for cabbage/celery
    "celery": 10,
    "asparagus": 4,
    "mushroom": 2,     # 1-2 days per spreadsheet item list
    "pepper": 10,      # bell/chili = 1-2 weeks per spreadsheet
    "bell pepper": 10,
    "chili pepper": 10,

    # ── Produce: PRO_09 Melons (7 days) ──
    "melon": 7,
    "watermelon": 7,
    "cantaloupe": 7,
    "honeydew": 7,

    # ── Produce: individual items from spreadsheet ──
    "avocado": 3,      # until ripe + 3-4 days fridge
    "banana": 2,       # 2 days fridge (skin blackens), best kept on counter
    "mango": 4,        # tropical, similar to fleshy veg
    "pineapple": 4,
    "peach": 3,        # PRO_07 apricots/peaches/plums = 2-3 days fridge
    "plum": 3,
    "apricot": 3,

    # ── Eggs & Dairy: DAI_01 Liquid Dairy (7 days) ──
    "milk": 7,
    "cream": 7,
    "heavy cream": 7,
    "half and half": 7,
    "buttermilk": 7,

    # ── Eggs & Dairy: DAI_02 Soft/High-Moisture Cheese (10 days) ──
    "mozzarella": 10,
    "feta": 10,
    "brie": 10,
    "ricotta": 10,
    "cottage cheese": 10,
    "cream cheese": 10,
    "goat cheese": 10,

    # ── Eggs & Dairy: DAI_03 Hard/Low-Moisture Cheese (60 days) ──
    "cheddar": 60,
    "parmesan": 60,
    "parm": 60,
    "gouda": 60,
    "swiss cheese": 60,
    "swiss": 60,
    "provolone": 60,
    "romano": 60,

    # ── Eggs & Dairy: DAI_04 Eggs (28 days) ──
    "eggs": 28,
    "egg": 28,

    # ── Eggs & Dairy: DAI_05 Non-Dairy Milks (8 days once opened) ──
    "oat milk": 8,
    "almond milk": 8,
    "soy milk": 8,
    "coconut milk": 8,

    # ── Eggs & Dairy: general ──
    "yogurt": 14,      # DAI_02 range covers yogurt ~1-2 weeks
    "greek yogurt": 14,
    "butter": 30,      # butter is stable, ~1 month fridge
    "sour cream": 14,
    "kefir": 14,

    # ── Meat: MEA_01 Ground Meats (2 days) ──
    "ground beef": 2,
    "ground turkey": 2,
    "ground pork": 2,
    "ground chicken": 2,
    "ground meat": 2,

    # ── Meat: MEA_02 Whole/Cut Poultry (2 days) ──
    "chicken": 2,
    "turkey": 2,
    "duck": 2,
    "chicken breast": 2,
    "chicken thighs": 2,
    "chicken wings": 2,

    # ── Meat: MEA_03 Steaks, Chops, Roasts (4 days) ──
    "beef": 4,
    "steak": 4,
    "pork": 4,
    "pork chop": 4,
    "lamb": 4,
    "veal": 4,
    "roast": 4,

    # ── Meat: MEA_04 Lean Fish (2 days) ──
    "cod": 2,
    "tilapia": 2,
    "halibut": 2,
    "tuna": 2,
    "tuna fresh": 2,

    # ── Meat: MEA_05 Fatty Fish (2 days) ──
    "salmon": 2,
    "mackerel": 2,
    "sardine": 2,
    "trout": 2,

    # ── Meat: MEA_06 Shellfish (2 days) ──
    "shrimp": 2,
    "crab": 2,
    "lobster": 2,
    "clam": 2,
    "scallop": 2,
    "oyster": 2,

    # ── Meat: MEA_07 Processed/Cured Meats (10 days) ──
    "bacon": 10,
    "sausage": 10,
    "hot dogs": 10,
    "pepperoni": 10,

    # ── Deli: DEL_01 Deli Salads / Dips (5 days) ──
    "deli meat": 5,
    "ham": 5,
    "turkey breast": 5,
    "salami": 5,
    "prosciutto": 5,
    "roast beef": 5,
    "pastrami": 5,
    "hummus": 5,
    "deli salad": 5,

    # ── Pantry: PAN_01 High-Acid Canned (365 days) ──
    "canned tomatoes": 365,
    "canned fruit": 365,
    "canned peaches": 365,

    # ── Pantry: PAN_02 Low-Acid Canned (730 days) ──
    "canned beans": 730,
    "canned corn": 730,
    "canned soup": 730,
    "canned vegetables": 730,
    "canned meat": 730,
    "beans": 730,

    # ── Pantry: PAN_03 Dry Grains & Pasta (730 days) ──
    "rice": 730,
    "pasta": 730,
    "oats": 730,
    "oatmeal": 730,
    "brown rice": 730,
    "quinoa": 730,
    "flour": 365,      # white flour 6-12 months
    "cereal": 270,     # 6-12 months, use 9

    # ── Pantry: PAN_04 Baking & Spices (365 days) ──
    "sugar": 730,      # indefinite per spreadsheet, use 2 years
    "salt": 730,
    "baking powder": 270,
    "baking soda": 270,
    "spices": 365,
    "herbs": 365,

    # ── Pantry: PAN_05 Condiments / Sauces (365 days) ──
    "ketchup": 365,
    "mustard": 365,
    "hot sauce": 365,
    "soy sauce": 365,
    "olive oil": 365,
    "vegetable oil": 365,
    "vinegar": 730,
    "honey": 730,
    "jam": 365,
    "jelly": 365,
    "peanut butter": 365,
    "almond butter": 365,

    # ── Pantry: PAN_06 Bread & Bakery (21 days counter) ──
    "bread": 21,
    "bagel": 14,
    "tortilla": 14,
    "crackers": 90,

    # ── Leftovers (3 days) ──
    "leftover": 3,
    "cooked rice": 4,     # DAI_05 area — 3-5 days
    "cooked pasta": 4,
    "cooked meat": 4,
    "cooked poultry": 4,
    "cooked soup": 4,
    "cooked stew": 4,
    "pizza": 4,
    "casserole": 4,
}

# ---------------------------------------------------------------------------
# Category auto-detection keywords
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS: Dict[CategoryType, list] = {
    CategoryType.PRODUCE: [
        "apple", "pear", "grape", "cherry", "fig", "nectarine",
        "orange", "lemon", "lime", "clementine", "grapefruit", "mandarin",
        "strawberry", "blueberry", "blackberry", "raspberry", "berry",
        "lettuce", "spinach", "arugula", "kale", "basil", "cilantro",
        "parsley", "mint", "chard", "collard", "herb",
        "carrot", "beet", "turnip", "parsnip", "radish", "ginger",
        "onion", "garlic", "potato", "sweet potato", "shallot",
        "tomato", "cucumber", "eggplant", "zucchini", "squash", "corn",
        "broccoli", "cauliflower", "brussels", "cabbage", "celery",
        "asparagus", "mushroom", "pepper", "melon", "watermelon",
        "cantaloupe", "honeydew", "avocado", "banana", "mango",
        "pineapple", "peach", "plum", "apricot", "produce", "fruit",
        "vegetable", "veggie",
    ],
    CategoryType.EGGS_DAIRY: [
        "milk", "cream", "buttermilk", "half and half",
        "mozzarella", "feta", "brie", "ricotta", "cottage cheese",
        "cream cheese", "goat cheese", "cheddar", "parmesan", "parm",
        "gouda", "swiss", "provolone", "romano",
        "egg", "eggs", "yogurt", "greek yogurt", "butter", "sour cream",
        "kefir", "oat milk", "almond milk", "soy milk", "coconut milk",
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
        "roast beef", "pastrami", "hummus", "hot dogs", "pepperoni",
        "cold cut",
    ],
    CategoryType.PANTRY: [
        "rice", "pasta", "oats", "oatmeal", "quinoa", "flour", "cereal",
        "sugar", "salt", "honey", "jam", "jelly", "peanut butter",
        "almond butter", "ketchup", "mustard", "hot sauce", "soy sauce",
        "olive oil", "vegetable oil", "vinegar", "bread", "bagel",
        "tortilla", "crackers", "canned", "beans", "lentils", "grain",
        "baking", "spice", "condiment",
    ],
    CategoryType.FREEZER: [
        "frozen", "ice cream", "tv dinner", "pizza frozen",
        "chicken nuggets", "waffle", "pancakes frozen",
    ],
    CategoryType.LEFTOVERS: [
        "leftover", "cooked", "casserole", "stew", "soup cooked",
    ],
}

# ---------------------------------------------------------------------------
# Category-based fallback shelf life (used when item name not in EXPIRATION_DATABASE)
# Based on Generic fallback rules from spreadsheet
# ---------------------------------------------------------------------------
CATEGORY_DEFAULT_DAYS: Dict[CategoryType, int] = {
    CategoryType.PRODUCE:    5,    # GEN_PRO
    CategoryType.EGGS_DAIRY: 7,    # GEN_DAI
    CategoryType.MEAT:       2,    # GEN_MEA
    CategoryType.DELI:       4,    # GEN_DEL
    CategoryType.PANTRY:     365,  # GEN_PAN = 1 year
    CategoryType.FREEZER:    90,   # GEN_FRE = 3 months
    CategoryType.LEFTOVERS:  3,    # GEN_LEF
}


def get_expiration_date(item_name: str, purchase_date: Optional[datetime] = None,
                        location: LocationType = LocationType.FRIDGE) -> datetime:
    """
    Calculate expiration date from item name and storage location.
    Uses EXPIRATION_DATABASE first, then falls back to category-based defaults.
    Location adjustments: freezer extends shelf life, pantry uses pantry-appropriate defaults.
    """
    if purchase_date is None:
        purchase_date = datetime.now()

    item_lower = item_name.lower().strip()

    # Exact or substring match in database
    shelf_life_days = None
    for key, days in EXPIRATION_DATABASE.items():
        if key in item_lower or item_lower in key:
            shelf_life_days = days
            break

    # Fall back to category-based default
    if shelf_life_days is None:
        guessed_category = categorize_item(item_name)
        shelf_life_days = CATEGORY_DEFAULT_DAYS.get(guessed_category, 5)

    # Location adjustments
    if location == LocationType.FREEZER:
        # Freezer extends fridge life significantly
        shelf_life_days = max(shelf_life_days * 4, 90)
    elif location == LocationType.PANTRY:
        # Pantry items already have long lives; bump short ones up
        if shelf_life_days < 14:
            shelf_life_days = 30

    return purchase_date + timedelta(days=shelf_life_days)


def categorize_item(item_name: str) -> CategoryType:
    """Auto-categorize item by matching name against category keyword lists."""
    item_lower = item_name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in item_lower:
                return category
    return CategoryType.PRODUCE  # default


def get_color_code(expiration_date: datetime, location: LocationType) -> str:
    """
    Simplified color system per TA feedback: green / yellow / red only.
      green  = 7+ days remaining
      yellow = 3–6 days remaining
      red    = < 3 days or already expired
    Location no longer affects color (no more blue/black).
    """
    now = datetime.now()
    days_until_expiry = (expiration_date - now).days

    if days_until_expiry < 0:
        return "red"
    elif days_until_expiry < 3:
        return "red"
    elif days_until_expiry < 7:
        return "yellow"
    else:
        return "green"