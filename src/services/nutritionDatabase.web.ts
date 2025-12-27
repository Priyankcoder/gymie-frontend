/**
 * Offline Nutrition Database Service - Web Stub
 * 
 * Web platform does not support SQLite due to WASM limitations with Metro bundler.
 * This stub provides the same interface but returns empty/mock data.
 */

export interface DishNutrition {
  dish_id: string;
  display_name: string;
  category: string;
  cuisine: string;
  base_serving_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface DishSearchResult {
  dish_id: string;
  display_name: string;
  category: string;
  cuisine: string;
}

export type PortionSize = 'small' | 'medium' | 'large';

export interface ScaledNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  portion: PortionSize;
  multiplier: number;
}

class NutritionDatabaseService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('[NutritionDB] Web platform - offline features not available');
    this.isInitialized = true;
  }

  async getDishNutrition(
    dishId: string,
    portion: PortionSize = 'medium'
  ): Promise<ScaledNutrition | null> {
    console.log('[NutritionDB] Web platform - returning null for dish:', dishId);
    return null;
  }

  async searchDishes(query: string, limit: number = 20): Promise<DishSearchResult[]> {
    console.log('[NutritionDB] Web platform - returning empty search results');
    return [];
  }

  async getAllDishes(): Promise<DishSearchResult[]> {
    console.log('[NutritionDB] Web platform - returning empty dish list');
    return [];
  }

  async getDishesByCategory(category: string): Promise<DishSearchResult[]> {
    console.log('[NutritionDB] Web platform - returning empty category results');
    return [];
  }

  async getDishDetails(dishId: string): Promise<DishNutrition | null> {
    console.log('[NutritionDB] Web platform - returning null for dish details');
    return null;
  }

  async recordCorrection(correction: any): Promise<void> {
    console.log('[NutritionDB] Web platform - corrections not supported');
  }

  async getUnsyncedCorrections(): Promise<any[]> {
    return [];
  }

  async markCorrectionsSynced(ids: number[]): Promise<void> {
    // No-op
  }
}

// Export singleton instance
export const nutritionDB = new NutritionDatabaseService();
export default nutritionDB;
