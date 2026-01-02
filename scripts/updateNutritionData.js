
/**
 * Script to convert comprehensive_nutrition.csv to fullNutritionData.json
 * Run: node frontend/scripts/updateNutritionData.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const CSV_PATH = path.join(__dirname, '../ml-model/comprehensive_nutrition.csv');
const JSON_PATH = path.join(__dirname, '../src/data/fullNutritionData.json');

console.log('🔄 Converting comprehensive_nutrition.csv to fullNutritionData.json...\n');

// Read CSV file
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Skip header
const dataLines = lines.slice(1);

const nutritionData = [];
const timestamp = Date.now();

dataLines.forEach((line, index) => {
  // Parse CSV line (handle commas in quotes)
  const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  
  if (!values || values.length < 11) {
    console.warn(`⚠️  Skipping malformed line ${index + 2}`);
    return;
  }

  // Remove quotes from values
  const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

  const [
    indexNum,
    dish_id,
    display_name,
    category,
    cuisine,
    serving_grams,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium
  ] = cleanValues;

  // Create the data object matching the required format
  const entry = {
    master: {
      dish_id: dish_id,
      display_name: display_name,
      category: category,
      cuisine: cuisine,
      aliases: [display_name.toLowerCase()],
      created_at: timestamp,
      updated_at: timestamp
    },
    nutrition: {
      dish_id: dish_id,
      base_serving_grams: parseFloat(serving_grams),
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
      fiber: parseFloat(fiber),
      sodium: parseFloat(sodium)
    }
  };

  nutritionData.push(entry);
});

// Write JSON file
fs.writeFileSync(JSON_PATH, JSON.stringify(nutritionData, null, 2));

console.log(`✅ Successfully converted ${nutritionData.length} food items`);
console.log(`📝 Output file: ${JSON_PATH}`);
console.log(`\n🎉 Done! Please restart your app to use the updated nutrition data.`);
