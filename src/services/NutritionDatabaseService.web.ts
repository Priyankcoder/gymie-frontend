
/**
 * Nutrition Database Service - Web Implementation
 *
 * Uses AsyncStorage for web compatibility.
 * Provides the same interface as the native implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private initialized = false;
  private readonly STORAGE_PREFIX = 'nutrition_db';
  private readonly DB_VERSION = '1.0.0';

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[NutritionDB-Web] Already initialized');
      return;
    }

    this.initialized = true;
    console.log('[NutritionDB-Web] Web storage initialized successfully');
  }

  async getDishById(dishId: string): Promise<DishMaster | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}_dish_${dishId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[NutritionDB-Web] Error getting dish:', error);
      return null;
    }
  }

  async getNutritionById(dishId: string): Promise<DishNutrition | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}_nutrition_${dishId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[NutritionDB-Web] Error getting nutrition:', error);
      return null;
    }
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
    // For web, return empty array - can be enhanced with actual search later
    return [];
  }

  async getAllDishes(): Promise<DishMaster[]> {
    // For web, return empty array - can be enhanced to load from server
    return [];
  }

  async addUserCorrection(correction: Omit<UserCorrection, 'id'>): Promise<void> {
    try {
      const corrections = await this.getUnsyncedCorrections();
      corrections.push({ ...correction, id: Date.now() });
      await AsyncStorage.setItem(
        `${this.STORAGE_PREFIX}_corrections`,
        JSON.stringify(corrections)
      );
    } catch (error) {
      console.error('[NutritionDB-Web] Error adding correction:', error);
    }
  }

  async getUnsyncedCorrections(): Promise<UserCorrection[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}_corrections`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[NutritionDB-Web] Error getting corrections:', error);
      return [];
    }
  }

  async markCorrectionsSynced(ids: number[]): Promise<void> {
    try {
      const corrections = await this.getUnsyncedCorrections();
      const updated = corrections.map(c =>
        ids.includes(c.id!) ? { ...c, synced: 1 } : c
      );
      await AsyncStorage.setItem(
        `${this.STORAGE_PREFIX}_corrections`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('[NutritionDB-Web] Error marking synced:', error);
    }
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
