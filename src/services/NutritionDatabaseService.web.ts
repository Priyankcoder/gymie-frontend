
/**
 * Nutrition Database Service - Web Implementation
 * 
 * Uses expo-sqlite which supports web via WebSQL/IndexedDB.
 * Provides the same interface as the native implementation.
 */

import * as SQLite from 'expo-sqlite';

export interface DishMaster {
  dish_id: string;
  display_name: string;
  category: string;
  cuisine: string;
  aliases: string[];
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
  synced: number;
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

class NutritionDatabaseServiceWeb {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private readonly DB_NAME = 'nutrition.db';
  private readonly DB_VERSION = '1.0.0';

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[NutritionDB-Web] Already initialized');
      return;
    }

    try {
      console.log('[NutritionDB-Web] Initializing web database...');
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      
      await this.createTables();
      await this.initializeMetadata();
      
      this.initialized = true;
      console.log('[NutritionDB-Web] Database initialized successfully');
    } catch (error) {
      console.error('[NutritionDB-Web] Initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS dish_master (
        dish_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        category TEXT NOT NULL,
        cuisine TEXT NOT NULL,
        aliases TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dish_nutrition (
        dish_id TEXT PRIMARY KEY,
        base_serving_grams REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL NOT NULL,
        sodium REAL NOT NULL,
        FOREIGN KEY (dish_id) REFERENCES dish_master(dish_id)
      );

      CREATE TABLE IF NOT EXISTS user_corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_hash TEXT NOT NULL,
        predicted_dish_id TEXT NOT NULL,
        corrected_dish_id TEXT,
        predicted_portion TEXT NOT NULL,
        corrected_portion TEXT,
        confidence REAL NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS model_metadata (
        model_type TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        checksum TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dish_category ON dish_master(category);
      CREATE INDEX IF NOT EXISTS idx_dish_cuisine ON dish_master(cuisine);
      CREATE INDEX IF NOT EXISTS idx_corrections_synced ON user_corrections(synced);
    `);

    console.log('[NutritionDB-Web] Tables created');
  }

  private async initializeMetadata(): Promise<void> {
    if (!this.db) return;

    const metadata = await this.db.getFirstAsync<ModelMetadata>(
      'SELECT * FROM model_metadata WHERE model_type = ?',
      ['nutrition_db']
    );

    if (!metadata) {
      await this.db.runAsync(
        `INSERT INTO model_metadata (model_type, version, checksum, size_bytes, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        ['nutrition_db', this.DB_VERSION, '', 0, Date.now()]
      );
    }
  }

  async getDishById(dishId: string): Promise<DishMaster | null> {
    if (!this.db) throw new Error('Database not initialized');

    const dish = await this.db.getFirstAsync<DishMaster>(
      'SELECT * FROM dish_master WHERE dish_id = ?',
      [dishId]
    );

    if (dish && dish.aliases) {
      dish.aliases = JSON.parse(dish.aliases as any);
    }

    return dish || null;
  }

  async getNutritionById(dishId: string): Promise<DishNutrition | null> {
    if (!this.db) throw new Error('Database not initialized');

    const nutrition = await this.db.getFirstAsync<DishNutrition>(
      'SELECT * FROM dish_nutrition WHERE dish_id = ?',
      [dishId]
    );

    return nutrition || null;
  }

  async getCompleteDishInfo(dishId: string, portionMultiplier: number = 1.0): Promise<NutritionResult | null> {
    const dish = await this.getDishById(dishId);
    if (!dish) return null;

    const nutrition = await this.getNutritionById(dishId);
    if (!nutrition) return null;

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

  async searchDishes(query: string, limit: number = 10): Promise<DishMaster[]> {
    if (!this.db) throw new Error('Database not initialized');

    const dishes = await this.db.getAllAsync<DishMaster>(
      `SELECT * FROM dish_master 
       WHERE display_name LIKE ? OR aliases LIKE ?
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    );

    return dishes.map(dish => {
      if (dish.aliases) {
        dish.aliases = JSON.parse(dish.aliases as any);
      }
      return dish;
    });
  }

  async getAllDishes(): Promise<DishMaster[]> {
    if (!this.db) throw new Error('Database not initialized');

    const dishes = await this.db.getAllAsync<DishMaster>(
      'SELECT * FROM dish_master ORDER BY display_name'
    );

    return dishes.map(dish => {
      if (dish.aliases) {
        dish.aliases = JSON.parse(dish.aliases as any);
      }
      return dish;
    });
  }

  async addUserCorrection(correction: Omit<UserCorrection, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO user_corrections 
       (image_hash, predicted_dish_id, corrected_dish_id, predicted_portion, 
        corrected_portion, confidence, synced, created_at)
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
  }

  async getUnsyncedCorrections(): Promise<UserCorrection[]> {
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.getAllAsync<UserCorrection>(
      'SELECT * FROM user_corrections WHERE synced = 0'
    );
  }

  async markCorrectionsSynced(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE user_corrections SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  }

  async getVersion(): Promise<string> {
    return this.DB_VERSION;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

const nutritionDatabaseService = new NutritionDatabaseServiceWeb();

export default nutritionDatabaseService;
