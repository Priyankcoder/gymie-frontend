/**
 * Offline Nutrition Service
 * 
 * Integrates SQLite database with portion estimation for offline-first nutrition tracking.
 * This service provides the main interface for the app to interact with nutrition data.
 */

import { nutritionDatabase, DishSearchResult, ScaledNutrition, PortionSize } from './nutritionDatabase';
import { mlInferenceService } from './mlInferenceService';
import { Platform } from 'react-native';

export interface NutritionEstimation {
  dishId: string;
  dishName: string;
  portion: PortionSize;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  confidence: number; // 1.0 for manual selection, <1.0 for ML predictions
  isManualSelection: boolean;
  imageHash?: string;
}

export interface DishWithNutrition {
  dishId: string;
  dishName: string;
  category: string;
  cuisine: string;
  nutrition: {
    small: ScaledNutrition;
    medium: ScaledNutrition;
    large: ScaledNutrition;
  };
}

class OfflineNutritionService {
  private initialized = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await nutritionDatabase.initialize();
      
      // Initialize ML model (only on native platforms)
      if (Platform.OS !== 'web') {
        try {
          await mlInferenceService.initialize();
          console.log('[OfflineNutrition] ML model initialized');
        } catch (mlError) {
          console.warn('[OfflineNutrition] ML initialization failed, will use manual selection:', mlError);
          // Continue without ML - app will fall back to manual selection
        }
      }
      
      this.initialized = true;
      console.log('[OfflineNutrition] Service initialized');
    } catch (error) {
      console.error('[OfflineNutrition] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Estimate nutrition from an image
   * Uses ML model when available, falls back to manual selection
   */
  async estimateFromImage(imageUri: string): Promise<{
    needsManualSelection: boolean;
    suggestions: DishSearchResult[];
    imageHash: string;
    mlPrediction?: {
      dishId: string;
      dishName: string;
      confidence: number;
      inferenceTimeMs: number;
    };
  }> {
    if (!this.initialized) await this.initialize();

    // Generate hash for the image (for correction tracking)
    const imageHash = await this.hashImage(imageUri);

    // Try ML inference if available (native platforms only)
    if (Platform.OS !== 'web' && mlInferenceService.isAvailable()) {
      try {
        const mlResult = await mlInferenceService.classifyImage(imageUri);
        
        // Get top 5 predictions as suggestions
        const topPredictions = await mlInferenceService.classifyTopK(imageUri, 5);
        
        // Convert ML predictions to DishSearchResult format
        const suggestions: DishSearchResult[] = [];
        for (const pred of topPredictions) {
          const dishDetails = await nutritionDatabase.getDishDetails(pred.dishId);
          if (dishDetails) {
            suggestions.push({
              dish_id: pred.dishId,
              display_name: dishDetails.display_name,
              category: dishDetails.category,
              cuisine: dishDetails.cuisine,
            });
          }
        }

        // If high confidence (>70%), suggest it as primary prediction
        const needsManualSelection = mlResult.confidence < 0.7;

        return {
          needsManualSelection,
          suggestions,
          imageHash,
          mlPrediction: mlResult,
        };
      } catch (mlError) {
        console.warn('[OfflineNutrition] ML inference failed, falling back to manual selection:', mlError);
        // Fall through to manual selection
      }
    }

    // Fallback: Manual selection with popular dishes
    const suggestions = await nutritionDatabase.searchDishes('', 10);

    return {
      needsManualSelection: true,
      suggestions,
      imageHash,
    };
  }

  /**
   * Get nutrition estimation for a manually selected dish
   */
  async getNutritionForDish(
    dishId: string,
    portion: PortionSize,
    imageHash?: string
  ): Promise<NutritionEstimation | null> {
    if (!this.initialized) await this.initialize();

    try {
      const dishDetails = await nutritionDatabase.getDishDetails(dishId);
      if (!dishDetails) return null;

      const nutrition = await nutritionDatabase.getDishNutrition(dishId, portion);
      if (!nutrition) return null;

      return {
        dishId,
        dishName: dishDetails.display_name,
        portion,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        sodium: nutrition.sodium,
        confidence: 1.0, // Manual selection = 100% confidence
        isManualSelection: true,
        imageHash,
      };
    } catch (error) {
      console.error('[OfflineNutrition] Error getting nutrition:', error);
      return null;
    }
  }

  /**
   * Search for dishes
   */
  async searchDishes(query: string): Promise<DishSearchResult[]> {
    if (!this.initialized) await this.initialize();
    return nutritionDatabase.searchDishes(query);
  }

  /**
   * Get all dishes
   */
  async getAllDishes(): Promise<DishSearchResult[]> {
    if (!this.initialized) await this.initialize();
    return nutritionDatabase.getAllDishes();
  }

  /**
   * Get dishes by category
   */
  async getDishesByCategory(category: string): Promise<DishSearchResult[]> {
    if (!this.initialized) await this.initialize();
    return nutritionDatabase.getDishesByCategory(category);
  }

  /**
   * Get dish with all portion sizes
   */
  async getDishWithAllPortions(dishId: string): Promise<DishWithNutrition | null> {
    if (!this.initialized) await this.initialize();

    try {
      const dishDetails = await nutritionDatabase.getDishDetails(dishId);
      if (!dishDetails) return null;

      const small = await nutritionDatabase.getDishNutrition(dishId, 'small');
      const medium = await nutritionDatabase.getDishNutrition(dishId, 'medium');
      const large = await nutritionDatabase.getDishNutrition(dishId, 'large');

      if (!small || !medium || !large) return null;

      return {
        dishId,
        dishName: dishDetails.display_name,
        category: dishDetails.category,
        cuisine: dishDetails.cuisine,
        nutrition: { small, medium, large },
      };
    } catch (error) {
      console.error('[OfflineNutrition] Error getting dish with portions:', error);
      return null;
    }
  }

  /**
   * Record a user correction
   * This is used for improving the ML model over time
   */
  async recordCorrection(correction: {
    imageHash: string;
    predictedDishId?: string;
    correctedDishId: string;
    predictedPortion?: PortionSize;
    correctedPortion: PortionSize;
    confidence?: number;
  }): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      await nutritionDatabase.recordCorrection(correction);
      console.log('[OfflineNutrition] Correction recorded for syncing');
    } catch (error) {
      console.error('[OfflineNutrition] Error recording correction:', error);
    }
  }

  /**
   * Get unsynced corrections for backend upload
   */
  async getUnsyncedCorrections(): Promise<any[]> {
    if (!this.initialized) await this.initialize();
    return nutritionDatabase.getUnsyncedCorrections();
  }

  /**
   * Mark corrections as synced
   */
  async markCorrectionsAsSynced(ids: number[]): Promise<void> {
    if (!this.initialized) await this.initialize();
    return nutritionDatabase.markCorrectionsAsSynced(ids);
  }

  /**
   * Generate hash for image (for tracking corrections)
   * Simple hash based on URI and timestamp - no crypto library needed
   */
  private async hashImage(imageUri: string): Promise<string> {
    try {
      // Create a simple hash from URI and timestamp
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const platform = Platform.OS;
      
      // Combine elements to create unique identifier
      const hash = `${platform}_${timestamp}_${random}`;
      
      return hash;
    } catch (error) {
      console.error('[OfflineNutrition] Error hashing image:', error);
      return `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  /**
   * Estimate portion size from image dimensions
   * This is a simple heuristic-based approach (no ML)
   */
  estimatePortionFromImage(imageWidth: number, imageHeight: number): PortionSize {
    // Simple heuristic: assume larger images show larger portions
    // This is very basic and can be improved
    const area = imageWidth * imageHeight;
    const threshold1 = 500000; // pixels
    const threshold2 = 1000000; // pixels

    if (area < threshold1) return 'small';
    if (area < threshold2) return 'medium';
    return 'large';
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalDishes: number;
    unsyncedCorrections: number;
  }> {
    if (!this.initialized) await this.initialize();

    try {
      const allDishes = await nutritionDatabase.getAllDishes();
      const corrections = await nutritionDatabase.getUnsyncedCorrections();

      return {
        totalDishes: allDishes.length,
        unsyncedCorrections: corrections.length,
      };
    } catch (error) {
      console.error('[OfflineNutrition] Error getting statistics:', error);
      return { totalDishes: 0, unsyncedCorrections: 0 };
    }
  }
}

// Export singleton instance
export const offlineNutritionService = new OfflineNutritionService();
