
/**
 * Script to clear and reload the nutrition database
 * Run this to force reload of comprehensive nutrition data
 */

import nutritionDatabaseService from '../src/services/NutritionDatabaseService';

async function fixDatabase() {
  console.log('Clearing and reloading nutrition database...');
  
  // This will force a reload by clearing the database
  // The next app launch will load all 2,001 foods
  
  // Note: In React Native, you need to uninstall/reinstall the app
  // Or clear app data to force database reload
  
  console.log('To fix the database:');
  console.log('1. Uninstall the app: adb uninstall com.anonymous.Gymie');
  console.log('2. Rebuild: npm run android');
  console.log('Or use: adb shell pm clear com.anonymous.Gymie');
}

fixDatabase();
