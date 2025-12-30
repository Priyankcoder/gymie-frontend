
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
   * Get dish by ID
   */
  async getDish(dishId: string): Promise<DishMaster | null> {
    if (!this.db) throw new Error('Database not initialized');

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
    if (!this.db) throw new Error('Database not initialized');

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
    if (!this.db) throw new Error('Database not initialized');

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
