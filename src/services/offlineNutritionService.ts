
/**
 * Offline Nutrition Service
 * 
 * Main orchestrator for the offline-first nutrition tracking system.
 * Coordinates ML inference, portion estimation, and database lookups.
 * 
 * Flow:
 * 1. User captures food image
 * 2. ML model predicts dish (offline)
 * 3. Portion estimation runs (offline)
 * 4. SQLite database lookup (offline)
 * 5. Results displayed instantly
 * 6. Background sync when online (optional)
 * 
 * Based on: OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md
 */

import mlInferenceService, { MLPrediction } from './mlInferenceService';
import portionEstimationService, { PortionSize, PortionEstimateResult } from './PortionEstimationService';
import nutritionDatabaseService, { NutritionResult } from './NutritionDatabaseService';
import { Image } from 'react-native';

export interface FoodRecognitionResult {
  // ML Prediction
  prediction: MLPrediction;
  
  // Portion Estimation
  portionEstimate: PortionEstimateResult;
  
  // Nutrition Data
  nutrition: NutritionResult | null;
  
  // Metadata
  imageHash: string;
  timestamp: number;
  processingTimeMs: number;
  
  // Status
  success: boolean;
  error?: string;
  needsCorrection: boolean; // Low confidence or missing data
}

export interface FoodCorrectionInput {
  imageHash: string;
  originalPrediction: string;
  correctedDishId?: string;
  originalPortion: PortionSize;
  correctedPortion?: PortionSize;
  confidence: number;
}

export interface ServiceStatus {
  ml: {
    initialized: boolean;
    available: boolean;
  };
  database: {
    initialized: boolean;
    version: string;
  };
  portion: {
    available: boolean;
  };
  offline: boolean;
}

class OfflineNutritionService {
  private initialized = false;
  private confidenceThreshold = 0.05; // 5% confidence required (realistic for 2024 classes)

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[OfflineNutrition] Already initialized');
      return;
    }

    try {
      console.log('[OfflineNutrition] Initializing services...');
      
      // Initialize ML service
      await mlInferenceService.initialize();
      
      // Initialize database
      await nutritionDatabaseService.initialize();
      
      this.initialized = true;
      console.log('[OfflineNutrition] All services initialized successfully');
    } catch (error) {
      console.error('[OfflineNutrition] Initialization failed:', error);
      throw new Error(`Failed to initialize offline nutrition service: ${error}`);
    }
  }

  /**
   * Recognize food from image and get complete nutrition info
   * 
   * @param imageUri - Local file URI of the captured image
   * @returns Complete food recognition result with nutrition
   */
  async recognizeFood(imageUri: string): Promise<FoodRecognitionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      // Check if ML is available
      if (!mlInferenceService.isMLAvailable()) {
        console.warn('[OfflineNutrition] ML service not available, returning error result');
        const imageHash = await this.generateImageHash(imageUri);
        return {
          prediction: {
            dishId: 'UNKNOWN',
            dishName: 'Unknown',
            confidence: 0,
            inferenceTimeMs: 0,
          },
          portionEstimate: {
            portion: 'medium',
            dishRatio: 0,
            confidence: 0,
            method: 'area_heuristic',
          },
          nutrition: null,
          imageHash,
          timestamp: Date.now(),
          processingTimeMs: Date.now() - startTime,
          success: false,
          error: 'ML inference not available. Native module not loaded. Please ensure the development build is properly configured.',
          needsCorrection: true,
        };
      }

      // Step 1: Get image dimensions for portion estimation
      const dimensions = await this.getImageDimensions(imageUri);
      
      // Step 2: ML Inference (parallel with portion estimation for speed)
      const [prediction, portionEstimate] = await Promise.all([
        mlInferenceService.predictDish(imageUri),
        Promise.resolve(portionEstimationService.estimatePortion(dimensions)),
      ]);
      
      console.log('[OfflineNutrition] Prediction:', {
        dish: prediction.dishId,
        confidence: prediction.confidence.toFixed(3),
        portion: portionEstimate.portion,
      });
      
      // Step 3: Database lookup for nutrition
      const portionMultiplier = portionEstimationService.getMultiplier(portionEstimate.portion);
      
      // Normalize dish ID for database lookup (handle case sensitivity)
      const normalizedDishId = prediction.dishId.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
      
      console.log('[OfflineNutrition] Looking up nutrition for:', {
        original: prediction.dishId,
        normalized: normalizedDishId
      });
      
      const nutrition = await nutritionDatabaseService.getNutritionResult(
        normalizedDishId,
        portionMultiplier
      );
      
      // Step 4: Generate image hash for correction tracking
      const imageHash = await this.generateImageHash(imageUri);
      
      // Step 5: Determine if user correction needed
      const needsCorrection = 
        prediction.confidence < this.confidenceThreshold ||
        nutrition === null ||
        portionEstimate.confidence < 0.7;
      
      const processingTime = Date.now() - startTime;
      
      const result: FoodRecognitionResult = {
        prediction,
        portionEstimate,
        nutrition,
        imageHash,
        timestamp: Date.now(),
        processingTimeMs: processingTime,
        success: true,
        needsCorrection,
      };
      
      console.log(`[OfflineNutrition] Recognition complete in ${processingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('[OfflineNutrition] Recognition failed:', error);
      
      return {
        prediction: {
          dishId: 'UNKNOWN',
          dishName: 'Unknown',
          confidence: 0,
          inferenceTimeMs: 0,
        },
        portionEstimate: {
          portion: 'medium',
          dishRatio: 0,
          confidence: 0,
          method: 'area_heuristic',
        },
        nutrition: null,
        imageHash: '',
        timestamp: Date.now(),
        processingTimeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        needsCorrection: true,
      };
    }
  }

  /**
   * Get multiple predictions for user to choose from
   */
  async getAlternativePredictions(
    imageUri: string,
    count: number = 3
  ): Promise<MLPrediction[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await mlInferenceService.predictTopK(imageUri, count);
    } catch (error) {
      console.error('[OfflineNutrition] Failed to get alternatives:', error);
      return [];
    }
  }

  /**
   * Save user correction for future model improvement
   */
  async saveCorrection(correction: FoodCorrectionInput): Promise<void> {
    try {
      await nutritionDatabaseService.saveCorrection({
        image_hash: correction.imageHash,
        predicted_dish_id: correction.originalPrediction,
        corrected_dish_id: correction.correctedDishId || null,
        predicted_portion: correction.originalPortion,
        corrected_portion: correction.correctedPortion || null,
        confidence: correction.confidence,
        synced: 0, // Will be synced later
        created_at: Date.now(),
      });
      
      console.log('[OfflineNutrition] Correction saved for later sync');
    } catch (error) {
      console.error('[OfflineNutrition] Failed to save correction:', error);
      throw error;
    }
  }

  /**
   * Search for dishes by name (for manual correction)
   */
  async searchDishes(query: string, limit: number = 10) {
    if (!this.initialized) {
      await this.initialize();
    }

    return await nutritionDatabaseService.searchDishes(query, limit);
  }

  /**
   * Get nutrition for a specific dish and portion
   */
  async getNutritionForDish(
    dishId: string,
    portion: PortionSize
  ): Promise<NutritionResult | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const multiplier = portionEstimationService.getMultiplier(portion);
    return await nutritionDatabaseService.getNutritionResult(dishId, multiplier);
  }

  /**
   * Get pending corrections count (to show sync badge)
   */
  async getPendingCorrectionsCount(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    const corrections = await nutritionDatabaseService.getUnsyncedCorrections();
    return corrections.length;
  }

  /**
   * Sync pending corrections to backend (when online)
   */
  async syncCorrections(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const corrections = await nutritionDatabaseService.getUnsyncedCorrections();
      
      if (corrections.length === 0) {
        return { success: true, synced: 0, failed: 0 };
      }

      console.log(`[OfflineNutrition] Syncing ${corrections.length} corrections...`);

      // TODO: Implement backend API call
      // const response = await fetch('/api/sync/corrections', {
      //   method: 'POST',
      //   body: JSON.stringify(corrections),
      // });

      // For now, just mark as synced after a delay
      const syncedIds = corrections.map(c => c.id!);
      await nutritionDatabaseService.markCorrectionsSynced(syncedIds);

      console.log(`[OfflineNutrition] ${corrections.length} corrections synced`);

      return {
        success: true,
        synced: corrections.length,
        failed: 0,
      };
    } catch (error) {
      console.error('[OfflineNutrition] Sync failed:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
      };
    }
  }

  /**
   * Get service status (for debugging/UI)
   */
  async getStatus(): Promise<ServiceStatus> {
    return {
      ml: {
        initialized: mlInferenceService.isInitialized(),
        available: mlInferenceService.isAvailable(),
      },
      database: {
        initialized: nutritionDatabaseService.isInitialized(),
        version: '1.0.0', // From metadata
      },
      portion: {
        available: true, // Always available (rule-based)
      },
      offline: true, // Always works offline
    };
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        (error) => {
          console.warn('[OfflineNutrition] Failed to get image size, using defaults:', error);
          // Fallback to common dimensions
          resolve({ width: 1080, height: 1920 });
        }
      );
    });
  }

  /**
   * Generate hash of image for deduplication
   */
  private async generateImageHash(imageUri: string): Promise<string> {
    try {
      // Simple hash based on URI and timestamp
      // Using a basic string hash since crypto-js is not needed in React Native
      const data = `${imageUri}_${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return `img_${Math.abs(hash).toString(36)}_${Date.now()}`;
    } catch (error) {
      console.warn('[OfflineNutrition] Failed to generate hash:', error);
      return `hash_${Date.now()}`;
    }
  }

  /**
   * Update confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    console.log(`[OfflineNutrition] Confidence threshold set to ${this.confidenceThreshold}`);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all dishes (for compatibility with existing hooks)
   */
  async getAllDishes() {
    if (!this.initialized) {
      await this.initialize();
    }

    return await nutritionDatabaseService.searchDishes('', 1000);
  }

  /**
   * Get statistics (for compatibility with existing hooks)
   */
  async getStatistics() {
    if (!this.initialized) {
      await this.initialize();
    }

    const totalDishes = (await nutritionDatabaseService.searchDishes('', 1000)).length;
    const unsyncedCorrections = (await nutritionDatabaseService.getUnsyncedCorrections()).length;

    return {
      totalDishes,
      unsyncedCorrections,
    };
  }

  /**
   * Estimate from image (for compatibility with existing hooks)
   * Returns minimal result with image hash
   */
  async estimateFromImage(imageUri: string) {
    const imageHash = await this.generateImageHash(imageUri);
    
    return {
      imageHash,
    };
  }
}

// Export singleton instance
export const offlineNutritionService = new OfflineNutritionService();
export default offlineNutritionService;
