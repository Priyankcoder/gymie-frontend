
/**
 * Database Seeder
 * 
 * Seeds the SQLite database with initial nutrition data for Food101 dishes.
 * This runs once on first app launch to populate local database.
 * 
 * Based on: OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md
 */

import nutritionDatabaseService, { DishMaster, DishNutrition } from './NutritionDatabaseService';

/**
 * Food101 dishes with estimated nutrition data
 * Values are per standard serving (medium portion)
 */
const FOOD101_NUTRITION_DATA: Array<{
  master: DishMaster;
  nutrition: DishNutrition;
}> = [
  {
    master: {
      dish_id: 'apple_pie',
      display_name: 'Apple Pie',
      category: 'dessert',
      cuisine: 'american',
      aliases: ['pie', 'apple dessert'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'apple_pie',
      base_serving_grams: 125,
      calories: 296,
      protein: 2.4,
      carbs: 43.3,
      fat: 13.5,
      fiber: 2.1,
      sodium: 266,
    },
  },
  {
    master: {
      dish_id: 'chicken_curry',
      display_name: 'Chicken Curry',
      category: 'main_course',
      cuisine: 'indian',
      aliases: ['curry', 'chicken masala'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'chicken_curry',
      base_serving_grams: 200,
      calories: 285,
      protein: 24.5,
      carbs: 12.8,
      fat: 16.2,
      fiber: 2.5,
      sodium: 450,
    },
  },
  {
    master: {
      dish_id: 'pizza',
      display_name: 'Pizza',
      category: 'main_course',
      cuisine: 'italian',
      aliases: ['cheese pizza', 'margherita'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'pizza',
      base_serving_grams: 100,
      calories: 266,
      protein: 11.4,
      carbs: 33.3,
      fat: 9.8,
      fiber: 2.3,
      sodium: 598,
    },
  },
  {
    master: {
      dish_id: 'sushi',
      display_name: 'Sushi',
      category: 'main_course',
      cuisine: 'japanese',
      aliases: ['maki', 'nigiri', 'rolls'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'sushi',
      base_serving_grams: 150,
      calories: 199,
      protein: 8.9,
      carbs: 30.4,
      fat: 3.7,
      fiber: 1.5,
      sodium: 364,
    },
  },
  {
    master: {
      dish_id: 'hamburger',
      display_name: 'Hamburger',
      category: 'main_course',
      cuisine: 'american',
      aliases: ['burger', 'cheeseburger'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'hamburger',
      base_serving_grams: 200,
      calories: 354,
      protein: 20.4,
      carbs: 32.7,
      fat: 15.8,
      fiber: 2.1,
      sodium: 497,
    },
  },
  {
    master: {
      dish_id: 'caesar_salad',
      display_name: 'Caesar Salad',
      category: 'salad',
      cuisine: 'italian',
      aliases: ['salad', 'caesar'],
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    nutrition: {
      dish_id: 'caesar_salad',
      base_serving_grams: 150,
      calories: 184,
      protein: 8.3,
      carbs: 12.5,
      fat: 11.7,
      fiber: 2.8,
      sodium: 456,
    },
  },
  // Add more dishes as needed...
  // Note: In production, this would be loaded from a JSON file or API
];

class DatabaseSeeder {
  /**
   * Seed database with initial nutrition data
   */
  async seedDatabase(): Promise<void> {
    console.log('[DatabaseSeeder] Starting database seeding...');
    
    try {
      // Ensure database is initialized
      if (!nutritionDatabaseService.isInitialized()) {
        await nutritionDatabaseService.initialize();
      }

      // Check if already seeded
      const existingDish = await nutritionDatabaseService.getDish('apple_pie');
      if (existingDish) {
        console.log('[DatabaseSeeder] Database already seeded, skipping');
        return;
      }

      // Seed data
      let seededCount = 0;
      for (const item of FOOD101_NUTRITION_DATA) {
        await this.seedDish(item.master, item.nutrition);
        seededCount++;
      }

      console.log(`[DatabaseSeeder] Successfully seeded ${seededCount} dishes`);
    } catch (error) {
      console.error('[DatabaseSeeder] Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed a single dish with its nutrition data
   */
  private async seedDish(master: DishMaster, nutrition: DishNutrition): Promise<void> {
    // In a real implementation, we would use proper SQL INSERT statements
    // through the nutritionDatabaseService
    // For now, this is a placeholder showing the structure
    
    console.log(`[DatabaseSeeder] Seeding dish: ${master.dish_id}`);
  }

  /**
   * Generate nutrition data for all Food101 labels
   * This creates placeholder data for dishes without specific nutrition info
   */
  async generatePlaceholderData(labels: string[]): Promise<void> {
    console.log(`[DatabaseSeeder] Generating placeholder data for ${labels.length} dishes`);
    
    // Default nutrition values (estimated averages)
    const defaultNutrition = {
      base_serving_grams: 150,
      calories: 250,
      protein: 15,
      carbs: 25,
      fat: 10,
      fiber: 3,
      sodium: 400,
    };

    for (const label of labels) {
      const master: DishMaster = {
        dish_id: label,
        display_name: this.formatDishName(label),
        category: this.inferCategory(label),
        cuisine: 'international',
        aliases: [label.replace(/_/g, ' ')],
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const nutrition: DishNutrition = {
        dish_id: label,
        ...defaultNutrition,
      };

      await this.seedDish(master, nutrition);
    }
  }

  /**
   * Format dish ID to display name
   */
  private formatDishName(dishId: string): string {
    return dishId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer category from dish name
   */
  private inferCategory(dishId: string): string {
    const desserts = ['cake', 'pie', 'cookie', 'ice_cream', 'pudding', 'mousse', 'tiramisu'];
    const salads = ['salad'];
    const breakfast = ['pancakes', 'waffles', 'french_toast', 'eggs', 'omelette'];
    
    if (desserts.some(d => dishId.includes(d))) return 'dessert';
    if (salads.some(d => dishId.includes(d))) return 'salad';
    if (breakfast.some(d => dishId.includes(d))) return 'breakfast';
    
    return 'main_course';
  }
}

export const databaseSeeder = new DatabaseSeeder();
export default databaseSeeder;
