
/**
 * Nutrition Database Service
 * 
 * SQLite-based local nutrition database for offline-first operation.
 * Stores dish information and nutrition data for instant lookups.
 * 
 * Based on: OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md
 */

import * as SQLite from 'expo-sqlite';

export interface DishMaster {
  dish_id: string;
  display_name: string;
  category: string;
  cuisine: string;
  aliases: string[]; // JSON array
  created_at: number;
  updated_at: number;
}

export interface DishNutrition {
  dish_id: string;
  base_serving_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface UserCorrection {
  id?: number;
  image_hash: string;
  predicted_dish_id: string;
  corrected_dish_id: string | null;
  predicted_portion: string;
  corrected_portion: string | null;
  confidence: number;
  synced: number; // 0 or 1
  created_at: number;
}

export interface ModelMetadata {
  model_type: 'vision' | 'nutrition_db';
  version: string;
  checksum: string;
  size_bytes: number;
  updated_at: number;
}

export interface NutritionResult {
  dish: DishMaster;
  nutrition: DishNutrition;
  portion_multiplier: number;
  adjusted_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

class NutritionDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private readonly DB_NAME = 'nutrition.db';
  private readonly DB_VERSION = '1.0.0';

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[NutritionDB] Already initialized');
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      
      await this.createTables();
      await this.seedInitialData();
      await this.initializeMetadata();
      
      this.initialized = true;
      console.log('[NutritionDB] Database initialized successfully');
    } catch (error) {
      console.error('[NutritionDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Dish Master Table
      `CREATE TABLE IF NOT EXISTS dish_master (
        dish_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        category TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        aliases TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,
      
      // Nutrition Data Table
      `CREATE TABLE IF NOT EXISTS dish_nutrition (
        dish_id TEXT PRIMARY KEY,
        base_serving_grams INTEGER NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL DEFAULT 0,
        sodium REAL DEFAULT 0,
        FOREIGN KEY (dish_id) REFERENCES dish_master(dish_id)
      )`,
      
      // User Corrections (Local Cache)
      `CREATE TABLE IF NOT EXISTS user_corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_hash TEXT NOT NULL,
        predicted_dish_id TEXT NOT NULL,
        corrected_dish_id TEXT,
        predicted_portion TEXT NOT NULL,
        corrected_portion TEXT,
        confidence REAL NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,
      
      // Model Metadata
      `CREATE TABLE IF NOT EXISTS model_metadata (
        model_type TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        checksum TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,
    ];

    for (const sql of tables) {
      await this.db.execAsync(sql);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_dish_category ON dish_master(category)',
      'CREATE INDEX IF NOT EXISTS idx_corrections_synced ON user_corrections(synced)',
      'CREATE INDEX IF NOT EXISTS idx_corrections_dish ON user_corrections(predicted_dish_id)',
    ];

    for (const sql of indexes) {
      await this.db.execAsync(sql);
    }

    console.log('[NutritionDB] Tables created successfully');
  }

  /**
   * Initialize model metadata
   */
  private async initializeMetadata(): Promise<void> {
    if (!this.db) return;

    const metadata: ModelMetadata[] = [
      {
        model_type: 'vision',
        version: '1.0.0',
        checksum: 'initial',
        size_bytes: 0,
        updated_at: Date.now(),
      },
      {
        model_type: 'nutrition_db',
        version: this.DB_VERSION,
        checksum: 'initial',
        size_bytes: 0,
        updated_at: Date.now(),
      },
    ];

    for (const meta of metadata) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO model_metadata (model_type, version, checksum, size_bytes, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [meta.model_type, meta.version, meta.checksum, meta.size_bytes, meta.updated_at]
      );
    }
  }

  /**
   * Seed initial dish data
   */
  private async seedInitialData(): Promise<void> {
    if (!this.db) return;

    // Check if already seeded
    const count = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM dish_master'
    );

    if (count && count.count > 0) {
      console.log('[NutritionDB] Database already seeded with', count.count, 'dishes');
      return;
    }

    console.log('[NutritionDB] Seeding initial data...');

    const sampleDishes = [
      // Rice Dishes
      { id: 'BIRYANI_CHICKEN', name: 'Chicken Biryani', category: 'rice', cuisine: 'indian',
        serving: 300, cal: 450, pro: 25, carb: 50, fat: 15, fiber: 3, sodium: 800 },
      { id: 'BIRYANI_MUTTON', name: 'Mutton Biryani', category: 'rice', cuisine: 'indian',
        serving: 300, cal: 520, pro: 28, carb: 52, fat: 20, fiber: 3, sodium: 850 },
      { id: 'BIRYANI_VEGETABLE', name: 'Vegetable Biryani', category: 'rice', cuisine: 'indian',
        serving: 300, cal: 380, pro: 10, carb: 58, fat: 12, fiber: 5, sodium: 750 },
      { id: 'PULAO_VEGETABLE', name: 'Vegetable Pulao', category: 'rice', cuisine: 'indian',
        serving: 250, cal: 280, pro: 6, carb: 50, fat: 8, fiber: 4, sodium: 600 },
      { id: 'FRIED_RICE', name: 'Fried Rice', category: 'rice', cuisine: 'chinese',
        serving: 250, cal: 350, pro: 8, carb: 55, fat: 12, fiber: 2, sodium: 900 },
      { id: 'JEERA_RICE', name: 'Jeera Rice', category: 'rice', cuisine: 'indian',
        serving: 200, cal: 240, pro: 5, carb: 45, fat: 5, fiber: 1.5, sodium: 400 },
      
      // Curry Dishes
      { id: 'DAL_MAKHANI', name: 'Dal Makhani', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 220, pro: 10, carb: 25, fat: 10, fiber: 8, sodium: 650 },
      { id: 'DAL_TADKA', name: 'Dal Tadka', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 180, pro: 9, carb: 22, fat: 6, fiber: 8, sodium: 580 },
      { id: 'BUTTER_CHICKEN', name: 'Butter Chicken', category: 'curry', cuisine: 'indian',
        serving: 250, cal: 380, pro: 28, carb: 8, fat: 28, fiber: 2, sodium: 750 },
      { id: 'CHICKEN_CURRY', name: 'Chicken Curry', category: 'curry', cuisine: 'indian',
        serving: 250, cal: 320, pro: 30, carb: 10, fat: 20, fiber: 2, sodium: 700 },
      { id: 'RAJMA', name: 'Rajma', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 200, pro: 12, carb: 28, fat: 5, fiber: 10, sodium: 600 },
      { id: 'CHOLE', name: 'Chole (Chickpea Curry)', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 210, pro: 11, carb: 30, fat: 6, fiber: 9, sodium: 620 },
      { id: 'PANEER_BUTTER_MASALA', name: 'Paneer Butter Masala', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 320, pro: 14, carb: 12, fat: 25, fiber: 3, sodium: 700 },
      { id: 'PALAK_PANEER', name: 'Palak Paneer', category: 'curry', cuisine: 'indian',
        serving: 200, cal: 280, pro: 13, carb: 10, fat: 22, fiber: 4, sodium: 650 },
      
      // Bread
      { id: 'ROTI', name: 'Roti (Chapati)', category: 'bread', cuisine: 'indian',
        serving: 40, cal: 100, pro: 3, carb: 20, fat: 1, fiber: 2, sodium: 120 },
      { id: 'NAAN', name: 'Naan', category: 'bread', cuisine: 'indian',
        serving: 60, cal: 160, pro: 5, carb: 30, fat: 3, fiber: 1.5, sodium: 200 },
      { id: 'PARATHA', name: 'Paratha', category: 'bread', cuisine: 'indian',
        serving: 50, cal: 140, pro: 4, carb: 22, fat: 5, fiber: 2, sodium: 180 },
      { id: 'KULCHA', name: 'Kulcha', category: 'bread', cuisine: 'indian',
        serving: 60, cal: 150, pro: 4.5, carb: 28, fat: 3, fiber: 1.5, sodium: 190 },
      
      // Snacks
      { id: 'SAMOSA', name: 'Samosa', category: 'snacks', cuisine: 'indian',
        serving: 100, cal: 262, pro: 5, carb: 33, fat: 13, fiber: 3, sodium: 340 },
      { id: 'PAKORA_VEGETABLE', name: 'Vegetable Pakora', category: 'snacks', cuisine: 'indian',
        serving: 100, cal: 280, pro: 6, carb: 28, fat: 16, fiber: 3, sodium: 380 },
      { id: 'VADA', name: 'Vada', category: 'snacks', cuisine: 'indian',
        serving: 80, cal: 180, pro: 5, carb: 22, fat: 8, fiber: 3, sodium: 320 },
      { id: 'DHOKLA', name: 'Dhokla', category: 'snacks', cuisine: 'indian',
        serving: 100, cal: 160, pro: 6, carb: 28, fat: 3, fiber: 3, sodium: 280 },
      
      // Eggs
      { id: 'EGG_BOILED', name: 'Boiled Egg', category: 'eggs', cuisine: 'indian',
        serving: 50, cal: 78, pro: 6.3, carb: 0.6, fat: 5.3, fiber: 0, sodium: 62 },
      { id: 'EGG_OMELET', name: 'Omelet', category: 'eggs', cuisine: 'indian',
        serving: 100, cal: 154, pro: 13, carb: 1.1, fat: 11, fiber: 0, sodium: 180 },
      { id: 'EGG_BHURJI', name: 'Egg Bhurji', category: 'eggs', cuisine: 'indian',
        serving: 150, cal: 220, pro: 15, carb: 4, fat: 16, fiber: 1, sodium: 380 },
      
      // Breakfast
      { id: 'IDLI', name: 'Idli', category: 'breakfast', cuisine: 'south_indian',
        serving: 100, cal: 150, pro: 5, carb: 30, fat: 1, fiber: 2, sodium: 180 },
      { id: 'DOSA', name: 'Dosa', category: 'breakfast', cuisine: 'south_indian',
        serving: 120, cal: 180, pro: 6, carb: 32, fat: 3, fiber: 2, sodium: 220 },
      { id: 'POHA', name: 'Poha', category: 'breakfast', cuisine: 'indian',
        serving: 150, cal: 180, pro: 4, carb: 35, fat: 4, fiber: 2, sodium: 350 },
      { id: 'UPMA', name: 'Upma', category: 'breakfast', cuisine: 'south_indian',
        serving: 200, cal: 200, pro: 5, carb: 35, fat: 5, fiber: 3, sodium: 420 },
    ];

    for (const dish of sampleDishes) {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO dish_master (dish_id, display_name, category, cuisine, aliases) VALUES (?, ?, ?, ?, ?)',
        [dish.id, dish.name, dish.category, dish.cuisine, JSON.stringify([dish.name.toLowerCase()])]
      );

      await this.db.runAsync(
        `INSERT OR REPLACE INTO dish_nutrition
         (dish_id, base_serving_grams, calories, protein, carbs, fat, fiber, sodium)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [dish.id, dish.serving, dish.cal, dish.pro, dish.carb, dish.fat, dish.fiber, dish.sodium]
      );
    }

    console.log(`[NutritionDB] Seeded ${sampleDishes.length} dishes`);
  }

  /**
   * Get dish by ID
   */
  async getDish(dishId: string): Promise<DishMaster | null> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }

    if (!this.db) {
      console.error('[NutritionDB] Database not available');
      return null;
    }

    try {
      const result = await this.db.getFirstAsync<DishMaster>(
        'SELECT * FROM dish_master WHERE dish_id = ?',
        [dishId]
      );

      if (!result) return null;

      return {
        ...result,
        aliases: result.aliases ? JSON.parse(result.aliases as any) : [],
      };
    } catch (error) {
      console.error('[NutritionDB] Error fetching dish:', error);
      return null;
    }
  }

  /**
   * Get nutrition data for dish
   */
  async getNutrition(dishId: string): Promise<DishNutrition | null> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }

    if (!this.db) {
      console.error('[NutritionDB] Database not available');
      return null;
    }

    try {
      const result = await this.db.getFirstAsync<DishNutrition>(
        'SELECT * FROM dish_nutrition WHERE dish_id = ?',
        [dishId]
      );

      return result || null;
    } catch (error) {
      console.error('[NutritionDB] Error fetching nutrition:', error);
      return null;
    }
  }

  /**
   * Get complete nutrition result with portion adjustment
   */
  async getNutritionResult(
    dishId: string,
    portionMultiplier: number
  ): Promise<NutritionResult | null> {
    const dish = await this.getDish(dishId);
    const nutrition = await this.getNutrition(dishId);

    if (!dish || !nutrition) return null;

    return {
      dish,
      nutrition,
      portion_multiplier: portionMultiplier,
      adjusted_nutrition: {
        calories: nutrition.calories * portionMultiplier,
        protein: nutrition.protein * portionMultiplier,
        carbs: nutrition.carbs * portionMultiplier,
        fat: nutrition.fat * portionMultiplier,
        fiber: nutrition.fiber * portionMultiplier,
        sodium: nutrition.sodium * portionMultiplier,
      },
    };
  }

  /**
   * Save user correction for later sync
   */
  async saveCorrection(correction: Omit<UserCorrection, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        `INSERT INTO user_corrections 
         (image_hash, predicted_dish_id, corrected_dish_id, predicted_portion, corrected_portion, confidence, synced, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          correction.image_hash,
          correction.predicted_dish_id,
          correction.corrected_dish_id,
          correction.predicted_portion,
          correction.corrected_portion,
          correction.confidence,
          correction.synced,
          correction.created_at,
        ]
      );

      console.log('[NutritionDB] Correction saved:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('[NutritionDB] Error saving correction:', error);
      throw error;
    }
  }

  /**
   * Get unsynced corrections
   */
  async getUnsyncedCorrections(): Promise<UserCorrection[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<UserCorrection>(
        'SELECT * FROM user_corrections WHERE synced = 0 ORDER BY created_at DESC'
      );

      return results;
    } catch (error) {
      console.error('[NutritionDB] Error fetching unsynced corrections:', error);
      return [];
    }
  }

  /**
   * Mark corrections as synced
   */
  async markCorrectionsSynced(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;

    try {
      const placeholders = ids.map(() => '?').join(',');
      await this.db.runAsync(
        `UPDATE user_corrections SET synced = 1 WHERE id IN (${placeholders})`,
        ids
      );

      console.log(`[NutritionDB] Marked ${ids.length} corrections as synced`);
    } catch (error) {
      console.error('[NutritionDB] Error marking corrections as synced:', error);
      throw error;
    }
  }

  /**
   * Search dishes by name or alias
   */
  async searchDishes(query: string, limit: number = 10): Promise<DishMaster[]> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }

    if (!this.db) {
      console.error('[NutritionDB] Database not available');
      return [];
    }

    try {
      const searchQuery = `%${query.toLowerCase()}%`;
      const results = await this.db.getAllAsync<DishMaster>(
        `SELECT * FROM dish_master
         WHERE LOWER(display_name) LIKE ?
         OR LOWER(aliases) LIKE ?
         LIMIT ?`,
        [searchQuery, searchQuery, limit]
      );

      return results.map(row => ({
        ...row,
        aliases: row.aliases ? JSON.parse(row.aliases as any) : [],
      }));
    } catch (error) {
      console.error('[NutritionDB] Error searching dishes:', error);
      return [];
    }
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(modelType: 'vision' | 'nutrition_db'): Promise<ModelMetadata | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<ModelMetadata>(
        'SELECT * FROM model_metadata WHERE model_type = ?',
        [modelType]
      );

      return result || null;
    } catch (error) {
      console.error('[NutritionDB] Error fetching metadata:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
      console.log('[NutritionDB] Database closed');
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const nutritionDatabaseService = new NutritionDatabaseService();
export default nutritionDatabaseService;
