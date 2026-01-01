
#!/usr/bin/env python3
"""
Map Google AIY food labels to nutrition data from public databases
Uses USDA FoodData Central and Open Food Facts
"""

import json
import requests
import time
from typing import Dict, List, Optional
import csv

# Load the 2024 food labels
with open('labels.json', 'r') as f:
    FOOD_LABELS = json.load(f)

print(f"Loaded {len(FOOD_LABELS)} food labels")

class NutritionMapper:
    def __init__(self):
        # USDA FoodData Central API (free, no API key for basic search)
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"
        self.usda_api_key = "DEMO_KEY"  # Get free key at: https://fdc.nal.usda.gov/api-key-signup.html
        
        # Open Food Facts API (free, no key needed)
        self.off_base_url = "https://world.openfoodfacts.org/cgi"
        
        self.cache = {}
        self.results = []
        
    def search_usda(self, food_name: str) -> Optional[Dict]:
        """Search USDA FoodData Central"""
        try:
            # Clean up food name
            query = food_name.replace('_', ' ').strip()
            
            url = f"{self.usda_base_url}/foods/search"
            params = {
                'query': query,
                'api_key': self.usda_api_key,
                'pageSize': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('foods') and len(data['foods']) > 0:
                    food = data['foods'][0]
                    nutrients = {}
                    
                    # Extract nutrients
                    for nutrient in food.get('foodNutrients', []):
                        name = nutrient.get('nutrientName', '').lower()
                        value = nutrient.get('value', 0)
                        
                        if 'energy' in name or 'calorie' in name:
                            nutrients['calories'] = value
                        elif 'protein' in name:
                            nutrients['protein'] = value
                        elif 'carbohydrate' in name:
                            nutrients['carbs'] = value
                        elif 'total lipid' in name or 'fat' in name:
                            nutrients['fat'] = value
                        elif 'fiber' in name:
                            nutrients['fiber'] = value
                        elif 'sodium' in name:
                            nutrients['sodium'] = value
                    
                    if nutrients.get('calories'):
                        return {
                            'source': 'USDA',
                            'matched_name': food.get('description', query),
                            **nutrients
                        }
            
        except Exception as e:
            print(f"USDA error for '{food_name}': {e}")
        
        return None
    
    def search_open_food_facts(self, food_name: str) -> Optional[Dict]:
        """Search Open Food Facts database"""
        try:
            query = food_name.replace('_', ' ').strip()
            
            url = f"{self.off_base_url}/search.pl"
            params = {
                'search_terms': query,
                'search_simple': 1,
                'action': 'process',
                'json': 1,
                'page_size': 1
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('products') and len(data['products']) > 0:
                    product = data['products'][0]
                    nutriments = product.get('nutriments', {})
                    
                    if nutriments.get('energy-kcal_100g'):
                        return {
                            'source': 'OpenFoodFacts',
                            'matched_name': product.get('product_name', query),
                            'calories': nutriments.get('energy-kcal_100g', 0),
                            'protein': nutriments.get('proteins_100g', 0),
                            'carbs': nutriments.get('carbohydrates_100g', 0),
                            'fat': nutriments.get('fat_100g', 0),
                            'fiber': nutriments.get('fiber_100g', 0),
                            'sodium': nutriments.get('sodium_100g', 0) * 1000  # Convert g to mg
                        }
        
        except Exception as e:
            print(f"OFF error for '{food_name}': {e}")
        
        return None
    
    def get_nutrition(self, food_name: str) -> Optional[Dict]:
        """Get nutrition from any available source"""
        if food_name in self.cache:
            return self.cache[food_name]
        
        # Try USDA first
        result = self.search_usda(food_name)
        
        # Fallback to Open Food Facts
        if not result:
            result = self.search_open_food_facts(food_name)
        
        self.cache[food_name] = result
        time.sleep(0.2)  # Rate limiting
        
        return result
    
    def map_all_foods(self, start_idx=0, end_idx=None):
        """Map all food labels to nutrition data"""
        if end_idx is None:
            end_idx = len(FOOD_LABELS)
        
        print(f"\nMapping foods {start_idx} to {end_idx}...")
        
        for i in range(start_idx, end_idx):
            food_label = FOOD_LABELS[i]
            
            # Skip background
            if food_label == '__background__':
                continue
            
            # Skip unknown/invalid labels
            if food_label.startswith('/g/') or not food_label:
                continue
            
            print(f"\n[{i}/{len(FOOD_LABELS)}] {food_label}...", end=' ')
            
            nutrition = self.get_nutrition(food_label)
            
            if nutrition:
                result = {
                    'index': i,
                    'label': food_label,
                    'dish_id': self.generate_dish_id(food_label),
                    'display_name': nutrition['matched_name'],
                    'category': self.categorize_food(food_label),
                    'cuisine': self.guess_cuisine(food_label),
                    'source': nutrition['source'],
                    'serving_grams': 100,  # Standard serving
                    'calories': round(nutrition.get('calories', 0)),
                    'protein': round(nutrition.get('protein', 0), 1),
                    'carbs': round(nutrition.get('carbs', 0), 1),
                    'fat': round(nutrition.get('fat', 0), 1),
                    'fiber': round(nutrition.get('fiber', 0), 1),
                    'sodium': round(nutrition.get('sodium', 0))
                }
                self.results.append(result)
                print(f"✓ ({nutrition['source']})")
            else:
                print("✗ Not found")
            
            # Save progress every 50 items
            if (i - start_idx) % 50 == 0 and i > start_idx:
                self.save_results()
                print(f"\n💾 Progress saved: {len(self.results)} foods mapped")
    
    def generate_dish_id(self, label: str) -> str:
        """Generate dish ID from label"""
        return label.upper().replace(' ', '_').replace('-', '_')
    
    def categorize_food(self, label: str) -> str:
        """Guess category from label"""
        label_lower = label.lower()
        
        if any(word in label_lower for word in ['rice', 'biryani', 'pulao', 'risotto']):
            return 'rice'
        elif any(word in label_lower for word in ['curry', 'masala', 'dal', 'stew']):
            return 'curry'
        elif any(word in label_lower for word in ['bread', 'roti', 'naan', 'tortilla', 'baguette']):
            return 'bread'
        elif any(word in label_lower for word in ['pizza', 'burger', 'sandwich', 'hot dog']):
            return 'fast food'
        elif any(word in label_lower for word in ['salad', 'slaw']):
            return 'salad'
        elif any(word in label_lower for word in ['soup', 'broth', 'chowder']):
            return 'soup'
        elif any(word in label_lower for word in ['cake', 'pie', 'dessert', 'ice cream', 'cookie']):
            return 'dessert'
        elif any(word in label_lower for word in ['chicken', 'beef', 'pork', 'lamb', 'meat']):
            return 'meat'
        elif any(word in label_lower for word in ['fish', 'seafood', 'shrimp', 'salmon']):
            return 'seafood'
        else:
            return 'other'
    
    def guess_cuisine(self, label: str) -> str:
        """Guess cuisine from label"""
        label_lower = label.lower()
        
        # Indian cuisine markers
        if any(word in label_lower for word in ['biryani', 'masala', 'tandoori', 'curry', 'dal', 'paneer', 'naan', 'roti']):
            return 'indian'
        
        # Chinese cuisine
        if any(word in label_lower for word in ['kung pao', 'chow mein', 'dim sum', 'wonton']):
            return 'chinese'
        
        # Italian cuisine
        if any(word in label_lower for word in ['pizza', 'pasta', 'risotto', 'lasagna', 'carbonara']):
            return 'italian'
        
        # Mexican cuisine
        if any(word in label_lower for word in ['taco', 'burrito', 'quesadilla', 'nachos', 'salsa']):
            return 'mexican'
        
        # Japanese cuisine
        if any(word in label_lower for word in ['sushi', 'ramen', 'tempura', 'teriyaki', 'miso']):
            return 'japanese'
        
        # American cuisine
        if any(word in label_lower for word in ['burger', 'hot dog', 'bbq', 'fried chicken']):
            return 'american'
        
        return 'international'
    
    def save_results(self):
        """Save results to JSON and CSV"""
        # Save JSON
        with open('nutrition_mapping.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Save CSV for easy viewing
        if self.results:
            with open('nutrition_mapping.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=self.results[0].keys())
                writer.writeheader()
                writer.writerows(self.results)
        
        print(f"\n💾 Saved {len(self.results)} mappings")

if __name__ == '__main__':
    mapper = NutritionMapper()
    
    # Start mapping
    # You can run in batches: mapper.map_all_foods(0, 100) for first 100
    mapper.map_all_foods(0, 2024)  # Map all foods
    
    # Save final results
    mapper.save_results()
    
    print("\n" + "="*70)
    print(f"✅ Mapping complete!")
    print(f"   Total foods: {len(FOOD_LABELS)}")
    print(f"   Mapped: {len(mapper.results)}")
    print(f"   Success rate: {len(mapper.results)/len(FOOD_LABELS)*100:.1f}%")
    print("="*70)
    print("\nFiles created:")
    print("  - nutrition_mapping.json")
    print("  - nutrition_mapping.csv")
    print("\nNext step: Run populate_database.py to import into SQLite")
