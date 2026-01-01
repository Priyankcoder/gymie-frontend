
/**
 * Generate Full Nutrition Database from labels.json
 * 
 * This script reads all 2024 food labels and generates a complete
 * nutrition database with reasonable default values based on food categories.
 */

const fs = require('fs');
const path = require('path');

// Read labels
const labelsPath = path.join(__dirname, '../ml-model/labels.json');
const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

console.log(`Processing ${labels.length} food items...`);

// Default nutrition values by category (per 100g)
const nutritionDefaults = {
  // Desserts, pastries, sweets
  dessert: { calories: 350, protein: 4, carbs: 55, fat: 15, fiber: 2, sodium: 200 },
  
  // Main courses, meat dishes
  main_course: { calories: 250, protein: 25, carbs: 20, fat: 10, fiber: 3, sodium: 600 },
  
  // Rice, pasta, grain dishes
  grain: { calories: 180, protein: 6, carbs: 35, fat: 3, fiber: 2, sodium: 300 },
  
  // Vegetables, salads
  vegetable: { calories: 80, protein: 3, carbs: 15, fat: 2, fiber: 4, sodium: 150 },
  
  // Breads, baked goods
  bread: { calories: 280, protein: 8, carbs: 50, fat: 5, fiber: 3, sodium: 450 },
  
  // Soups, stews
  soup: { calories: 120, protein: 8, carbs: 15, fat: 4, fiber: 2, sodium: 700 },
  
  // Seafood
  seafood: { calories: 200, protein: 22, carbs: 5, fat: 10, fiber: 0, sodium: 400 },
  
  // Fried foods
  fried: { calories: 320, protein: 15, carbs: 30, fat: 18, fiber: 2, sodium: 500 },
  
  // Breakfast items
  breakfast: { calories: 250, protein: 10, carbs: 35, fat: 8, fiber: 3, sodium: 350 },
  
  // Beverages
  beverage: { calories: 120, protein: 2, carbs: 25, fat: 2, fiber: 0, sodium: 50 },
  
  // Default fallback
  default: { calories: 200, protein: 10, carbs: 25, fat: 8, fiber: 2, sodium: 400 },
};

// Categorize dish based on name keywords
function categorizeDish(dishName) {
  const lower = dishName.toLowerCase();
  
  if (lower.includes('cake') || lower.includes('pie') || lower.includes('cookie') || 
      lower.includes('ice cream') || lower.includes('pudding') || lower.includes('donut') ||
      lower.includes('brownie') || lower.includes('tart') || lower.includes('cheesecake')) {
    return { category: 'dessert', defaults: nutritionDefaults.dessert, serving: 120 };
  }
  
  if (lower.includes('rice') || lower.includes('pasta') || lower.includes('noodle') ||
      lower.includes('risotto') || lower.includes('pilaf')) {
    return { category: 'grain', defaults: nutritionDefaults.grain, serving: 200 };
  }
  
  if (lower.includes('salad') || lower.includes('vegetable')) {
    return { category: 'vegetable', defaults: nutritionDefaults.vegetable, serving: 150 };
  }
  
  if (lower.includes('bread') || lower.includes('biscuit') || lower.includes('bagel') ||
      lower.includes('croissant') || lower.includes('roll') || lower.includes('bun')) {
    return { category: 'bread', defaults: nutritionDefaults.bread, serving: 60 };
  }
  
  if (lower.includes('soup') || lower.includes('stew') || lower.includes('chowder')) {
    return { category: 'soup', defaults: nutritionDefaults.soup, serving: 250 };
  }
  
  if (lower.includes('fish') || lower.includes('shrimp') || lower.includes('crab') ||
      lower.includes('lobster') || lower.includes('clam') || lower.includes('oyster') ||
      lower.includes('sushi') || lower.includes('salmon')) {
    return { category: 'seafood', defaults: nutritionDefaults.seafood, serving: 150 };
  }
  
  if (lower.includes('fried') || lower.includes('fries') || lower.includes('tempura')) {
    return { category: 'fried', defaults: nutritionDefaults.fried, serving: 150 };
  }
  
  if (lower.includes('pancake') || lower.includes('waffle') || lower.includes('french toast') ||
      lower.includes('omelette') || lower.includes('scrambled')) {
    return { category: 'breakfast', defaults: nutritionDefaults.breakfast, serving: 150 };
  }
  
  if (lower.includes('juice') || lower.includes('smoothie') || lower.includes('shake') ||
      lower.includes('latte') || lower.includes('coffee')) {
    return { category: 'beverage', defaults: nutritionDefaults.beverage, serving: 300 };
  }
  
  // Default: main course
  return { category: 'main_course', defaults: nutritionDefaults.main_course, serving: 200 };
}

// Determine cuisine from dish name
function determineCuisine(dishName) {
  const lower = dishName.toLowerCase();
  
  if (lower.includes('sushi') || lower.includes('ramen') || lower.includes('tempura') ||
      lower.includes('teriyaki') || lower.includes('miso')) return 'japanese';
  
  if (lower.includes('curry') || lower.includes('tandoori') || lower.includes('biryani') ||
      lower.includes('naan') || lower.includes('masala')) return 'indian';
  
  if (lower.includes('pizza') || lower.includes('pasta') || lower.includes('risotto') ||
      lower.includes('tiramisu') || lower.includes('lasagna')) return 'italian';
  
  if (lower.includes('taco') || lower.includes('burrito') || lower.includes('quesadilla') ||
      lower.includes('enchilada') || lower.includes('guacamole')) return 'mexican';
  
  if (lower.includes('croissant') || lower.includes('baguette') || lower.includes('crepe') ||
      lower.includes('ratatouille') || lower.includes('quiche')) return 'french';
  
  if (lower.includes('dim sum') || lower.includes('dumpling') || lower.includes('wonton') ||
      lower.includes('chow mein') || lower.includes('spring roll')) return 'chinese';
  
  if (lower.includes('pad thai') || lower.includes('tom yum') || lower.includes('satay')) return 'thai';
  
  if (lower.includes('falafel') || lower.includes('hummus') || lower.includes('kebab') ||
      lower.includes('shawarma') || lower.includes('baklava')) return 'middle_eastern';
  
  return 'international';
}

// Generate nutrition data
const nutritionData = labels.map(dishName => {
  const dishId = dishName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  const { category, defaults, serving } = categorizeDish(dishName);
  const cuisine = determineCuisine(dishName);
  
  // Calculate nutrition per serving from per-100g defaults
  const servingRatio = serving / 100;
  
  return {
    master: {
      dish_id: dishId,
      display_name: dishName,
      category,
      cuisine,
      aliases: [dishName.toLowerCase()],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: dishId,
      base_serving_grams: serving,
      calories: Math.round(defaults.calories * servingRatio),
      protein: Math.round(defaults.protein * servingRatio * 10) / 10,
      carbs: Math.round(defaults.carbs * servingRatio * 10) / 10,
      fat: Math.round(defaults.fat * servingRatio * 10) / 10,
      fiber: Math.round(defaults.fiber * servingRatio * 10) / 10,
      sodium: Math.round(defaults.sodium * servingRatio),
    },
  };
});

// Write output
const outputPath = path.join(__dirname, '../src/data/fullNutritionData.json');
fs.writeFileSync(outputPath, JSON.stringify(nutritionData, null, 2));

console.log(`✅ Generated ${nutritionData.length} nutrition entries`);
console.log(`📄 Output: ${outputPath}`);
console.log('');
console.log('Categories breakdown:');
const categoryCounts = {};
nutritionData.forEach(item => {
  categoryCounts[item.master.category] = (categoryCounts[item.master.category] || 0) + 1;
});
Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});
