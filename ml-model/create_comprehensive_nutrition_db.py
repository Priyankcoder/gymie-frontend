
#!/usr/bin/env python3
"""
Create comprehensive nutrition database for all 2024 Google AIY foods
Uses pre-made mappings and standard nutrition values
"""

import json
import csv
from pathlib import Path

# Load food labels
with open('labels.json', 'r') as f:
    FOOD_LABELS = json.load(f)

print(f"Loaded {len(FOOD_LABELS)} food labels")

# Standard nutrition values (per 100g) for common food categories
STANDARD_NUTRITION = {
    'bread': {'cal': 265, 'pro': 9, 'carb': 49, 'fat': 3.2, 'fiber': 2.7, 'sodium': 491},
    'rice': {'cal': 130, 'pro': 2.7, 'carb': 28, 'fat': 0.3, 'fiber': 0.4, 'sodium': 1},
    'pasta': {'cal': 131, 'pro': 5, 'carb': 25, 'fat': 1.1, 'fiber': 1.8, 'sodium': 6},
    'pizza': {'cal': 266, 'pro': 11, 'carb': 33, 'fat': 10, 'fiber': 2.3, 'sodium': 598},
    'burger': {'cal': 295, 'pro': 17, 'carb': 24, 'fat': 14, 'fiber': 1.2, 'sodium': 396},
    'chicken': {'cal': 239, 'pro': 27, 'carb': 0, 'fat': 14, 'fiber': 0, 'sodium': 82},
    'beef': {'cal': 250, 'pro': 26, 'carb': 0, 'fat': 15, 'fiber': 0, 'sodium': 72},
    'pork': {'cal': 242, 'pro': 27, 'carb': 0, 'fat': 14, 'fiber': 0, 'sodium': 62},
    'fish': {'cal': 206, 'pro': 22, 'carb': 0, 'fat': 12, 'fiber': 0, 'sodium': 90},
    'seafood': {'cal': 99, 'pro': 20, 'carb': 0, 'fat': 1.7, 'fiber': 0, 'sodium': 111},
    'egg': {'cal': 155, 'pro': 13, 'carb': 1.1, 'fat': 11, 'fiber': 0, 'sodium': 124},
    'vegetable': {'cal': 65, 'pro': 2.9, 'carb': 13, 'fat': 0.4, 'fiber': 2.6, 'sodium': 16},
    'fruit': {'cal': 52, 'pro': 0.3, 'carb': 14, 'fat': 0.2, 'fiber': 2.4, 'sodium': 1},
    'salad': {'cal': 17, 'pro': 1.2, 'carb': 3.3, 'fat': 0.2, 'fiber': 1.3, 'sodium': 10},
    'soup': {'cal': 32, 'pro': 1.3, 'carb': 5.8, 'fat': 0.6, 'fiber': 0.5, 'sodium': 343},
    'curry': {'cal': 97, 'pro': 3.7, 'carb': 7.8, 'fat': 6.1, 'fiber': 2.1, 'sodium': 380},
    'dessert': {'cal': 257, 'pro': 3.2, 'carb': 36, 'fat': 11, 'fiber': 0.7, 'sodium': 139},
    'cake': {'cal': 257, 'pro': 3.2, 'carb': 36, 'fat': 11, 'fiber': 0.7, 'sodium': 139},
    'pie': {'cal': 237, 'pro': 2.4, 'carb': 34, 'fat': 11, 'fiber': 0.7, 'sodium': 197},
    'cookie': {'cal': 502, 'pro': 5.9, 'carb': 64, 'fat': 25, 'fiber': 2, 'sodium': 385},
    'cheese': {'cal': 402, 'pro': 25, 'carb': 1.3, 'fat': 33, 'fiber': 0, 'sodium': 621},
    'yogurt': {'cal': 59, 'pro': 3.5, 'carb': 4.7, 'fat': 3.3, 'fiber': 0, 'sodium': 36},
    'milk': {'cal': 61, 'pro': 3.2, 'carb': 4.8, 'fat': 3.3, 'fiber': 0, 'sodium': 44},
    'sandwich': {'cal': 250, 'pro': 12, 'carb': 30, 'fat': 9, 'fiber': 2, 'sodium': 450},
    'noodles': {'cal': 138, 'pro': 4.5, 'carb': 25, 'fat': 2.1, 'fiber': 1.2, 'sodium': 8},
    'dumpling': {'cal': 200, 'pro': 8, 'carb': 28, 'fat': 6, 'fiber': 1.5, 'sodium': 320},
    'snack': {'cal': 520, 'pro': 6, 'carb': 60, 'fat': 28, 'fiber': 2.5, 'sodium': 450},
    'drink': {'cal': 42, 'pro': 0, 'carb': 11, 'fat': 0, 'fiber': 0, 'sodium': 4},
}

def categorize_food(label):
    """Determine food category from label"""
    label_lower = label.lower()
    
    categories = {
        'bread': ['bread', 'naan', 'roti', 'baguette', 'roll', 'bun', 'croissant'],
        'rice': ['rice', 'biryani', 'pulao', 'risotto', 'pilaf'],
        'pasta': ['pasta', 'spaghetti', 'macaroni', 'lasagna', 'fettuccine'],
        'pizza': ['pizza'],
        'burger': ['burger', 'hamburger'],
        'chicken': ['chicken', 'poultry'],
        'beef': ['beef', 'steak'],
        'pork': ['pork', 'bacon', 'ham'],
        'fish': ['fish', 'salmon', 'tuna', 'cod'],
        'seafood': ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'clam'],
        'egg': ['egg', 'omelet'],
        'vegetable': ['vegetable', 'veggie', 'broccoli', 'carrot', 'spinach'],
        'fruit': ['fruit', 'apple', 'banana', 'orange', 'berry'],
        'salad': ['salad', 'slaw'],
        'soup': ['soup', 'broth', 'chowder', 'stew'],
        'curry': ['curry', 'masala', 'dal'],
        'dessert': ['dessert', 'pudding', 'ice cream'],
        'cake': ['cake', 'cupcake'],
        'pie': ['pie', 'tart'],
        'cookie': ['cookie', 'biscuit'],
        'cheese': ['cheese', 'paneer'],
        'yogurt': ['yogurt', 'yoghurt'],
        'milk': ['milk'],
        'sandwich': ['sandwich', 'wrap', 'sub'],
        'noodles': ['noodle', 'ramen', 'pho'],
        'dumpling': ['dumpling', 'wonton', 'momo'],
        'snack': ['chips', 'popcorn', 'pretzel', 'crisp'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in label_lower for keyword in keywords):
            return category
    
    return 'other'

def guess_cuisine(label):
    """Guess cuisine from label"""
    label_lower = label.lower()
    
    cuisines = {
        'indian': ['biryani', 'masala', 'tandoori', 'curry', 'dal', 'paneer', 'naan', 'roti', 'samosa', 'pakora', 'dosa', 'idli'],
        'chinese': ['kung pao', 'chow mein', 'dim sum', 'wonton', 'fried rice', 'spring roll'],
        'italian': ['pizza', 'pasta', 'risotto', 'lasagna', 'carbonara', 'pesto', 'bruschetta'],
        'mexican': ['taco', 'burrito', 'quesadilla', 'nachos', 'salsa', 'guacamole', 'enchilada'],
        'japanese': ['sushi', 'ramen', 'tempura', 'teriyaki', 'miso', 'udon', 'sashimi'],
        'american': ['burger', 'hot dog', 'bbq', 'fried chicken', 'mac and cheese'],
        'thai': ['pad thai', 'tom yum', 'curry'],
        'french': ['croissant', 'baguette', 'quiche', 'crepe'],
        'middle_eastern': ['falafel', 'hummus', 'shawarma', 'kebab'],
    }
    
    for cuisine, keywords in cuisines.items():
        if any(keyword in label_lower for keyword in keywords):
            return cuisine
    
    return 'international'

def get_nutrition_for_food(label, category):
    """Get estimated nutrition values"""
    base = STANDARD_NUTRITION.get(category, STANDARD_NUTRITION['snack'])
    
    # Apply adjustments based on preparation method
    label_lower = label.lower()
    multiplier = 1.0
    
    if 'fried' in label_lower or 'tempura' in label_lower:
        multiplier = 1.3  # More calories for fried foods
    elif 'grilled' in label_lower or 'baked' in label_lower:
        multiplier = 0.9  # Fewer calories for grilled
    elif 'steamed' in label_lower or 'boiled' in label_lower:
        multiplier = 0.8  # Fewer calories for steamed
    
    return {
        'calories': int(base['cal'] * multiplier),
        'protein': round(base['pro'] * multiplier, 1),
        'carbs': round(base['carb'] * multiplier, 1),
        'fat': round(base['fat'] * multiplier, 1),
        'fiber': round(base['fiber'] * multiplier, 1),
        'sodium': int(base['sodium'] * multiplier),
    }

def generate_dish_id(label):
    """Generate dish ID"""
    return label.upper().replace(' ', '_').replace('-', '_').replace('/', '_')[:50]

def create_nutrition_database():
    """Create comprehensive nutrition database"""
    dishes = []
    
    for idx, label in enumerate(FOOD_LABELS):
        # Skip background and invalid labels
        if label == '__background__' or label.startswith('/g/') or not label.strip():
            continue
        
        category = categorize_food(label)
        cuisine = guess_cuisine(label)
        nutrition = get_nutrition_for_food(label, category)
        
        dish = {
            'index': idx,
            'dish_id': generate_dish_id(label),
            'display_name': label,
            'category': category,
            'cuisine': cuisine,
            'serving_grams': 100,
            **nutrition
        }
        
        dishes.append(dish)
        
        if (idx + 1) % 100 == 0:
            print(f"Processed {idx + 1}/{len(FOOD_LABELS)} foods...")
    
    return dishes

def generate_sql(dishes):
    """Generate SQL INSERT statements"""
    sql_lines = [
        "-- Comprehensive Nutrition Database for 2024 Google AIY Foods",
        "-- Generated automatically",
        "",
        "BEGIN TRANSACTION;",
        ""
    ]
    
    for dish in dishes:
        dish_sql = f"""INSERT OR REPLACE INTO dish_master (dish_id, display_name, category, cuisine, created_at, updated_at)
VALUES ('{dish['dish_id']}', '{dish['display_name'].replace("'", "''")}', '{dish['category']}', '{dish['cuisine']}', {int(time.time())}, {int(time.time())});"""
        
        nutrition_sql = f"""INSERT OR REPLACE INTO dish_nutrition (dish_id, base_serving_grams, calories, protein, carbs, fat, fiber, sodium)
VALUES ('{dish['dish_id']}', {dish['serving_grams']}, {dish['calories']}, {dish['protein']}, {dish['carbs']}, {dish['fat']}, {dish['fiber']}, {dish['sodium']});"""
        
        sql_lines.append(dish_sql)
        sql_lines.append(nutrition_sql)
        sql_lines.append("")
    
    sql_lines.append("COMMIT;")
    
    return '\n'.join(sql_lines)

if __name__ == '__main__':
    import time
    
    print("="*70)
    print("Creating Comprehensive Nutrition Database")
    print("="*70)
    print()
    
    # Generate database
    dishes = create_nutrition_database()
    
    print(f"\n✅ Generated nutrition data for {len(dishes)} foods")
    
    # Save as JSON
    with open('comprehensive_nutrition.json', 'w') as f:
        json.dump(dishes, f, indent=2)
    print("✅ Saved: comprehensive_nutrition.json")
    
    # Save as CSV
    with open('comprehensive_nutrition.csv', 'w', newline='', encoding='utf-8') as f:
        if dishes:
            writer = csv.DictWriter(f, fieldnames=dishes[0].keys())
            writer.writeheader()
            writer.writerows(dishes)
    print("✅ Saved: comprehensive_nutrition.csv")
    
    # Generate SQL
    sql = generate_sql(dishes)
    with open('comprehensive_nutrition.sql', 'w') as f:
        f.write(sql)
    print("✅ Saved: comprehensive_nutrition.sql")
    
    # Statistics
    print("\n" + "="*70)
    print("Statistics")
    print("="*70)
    print(f"Total foods: {len(dishes)}")
    
    by_category = {}
    by_cuisine = {}
    for dish in dishes:
        by_category[dish['category']] = by_category.get(dish['category'], 0) + 1
        by_cuisine[dish['cuisine']] = by_cuisine.get(dish['cuisine'], 0) + 1
    
    print(f"\nBy Category:")
    for cat, count in sorted(by_category.items(), key=lambda x: -x[1])[:10]:
        print(f"  {cat}: {count}")
    
    print(f"\nBy Cuisine:")
    for cui, count in sorted(by_cuisine.items(), key=lambda x: -x[1])[:10]:
        print(f"  {cui}: {count}")
    
    print("\n" + "="*70)
    print("✅ Database generation complete!")
    print("="*70)
    print("\nNext step: Import SQL file into app database")
    print("  1. Copy comprehensive_nutrition.sql to Android assets")
    print("  2. Run it on app startup to populate database")
