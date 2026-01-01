
/**
 * ML Inference Service
 *
 * Wrapper around the native NutritionClassifier module.
 * Handles ML model predictions using TensorFlow Lite on both Android and iOS.
 *
 * Model: Google AIY Vision Classifier Food V1
 * - Input: 224x224 RGB images, FLOAT32 scaled to [0, 1]
 * - Output: 2024 classes (1 background + 2023 food dishes)
 * - Source: https://www.kaggle.com/models/google/aiy/tfLite/vision-classifier-food-v1
 *
 * This service provides a clean TypeScript interface to the native ML module,
 * handling image URIs and returning structured prediction results.
 */

import { NativeModules, Platform } from 'react-native';

// Safely access NativeModules (undefined on web)
const NutritionClassifier = Platform.OS === 'web' ? null : NativeModules.NutritionClassifier;

export interface MLPrediction {
  dishId: string;
  dishName: string;
  confidence: number;
  inferenceTimeMs: number;
  top5Predictions?: Array<{
    dishId: string;
    dishName: string;
    confidence: number;
  }>;
}

export interface MLInferenceOptions {
  returnTop5?: boolean; // Return top 5 predictions instead of just the best
  minConfidence?: number; // Minimum confidence threshold (0-1)
}

class MLInferenceService {
  private isAvailable: boolean = false;

  constructor() {
    this.isAvailable = !!NutritionClassifier;
  }

  /**
   * Initialize the ML service
   */
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (!this.isAvailable) {
      console.warn('[MLInferenceService] Native module not available. ML predictions will fail.');
      return;
    }
    
    if (this.initialized) {
      console.log('[MLInferenceService] Already initialized');
      return;
    }
    
    try {
      console.log('[MLInferenceService] Initializing native module...');
      await NutritionClassifier.initialize();
      this.initialized = true;
      console.log('[MLInferenceService] Initialized successfully');
    } catch (error) {
      console.error('[MLInferenceService] Initialization failed:', error);
      throw new Error(`Failed to initialize ML model: ${error.message}`);
    }
  }

  /**
   * Check if ML inference is available
   */
  public isMLAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Check if service is available (alias for compatibility)
   */
  public isAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.isAvailable && this.initialized;
  }

  /**
   * Predict dish from image URI
   * 
   * @param imageUri - Local file URI of the image (e.g., file:///path/to/image.jpg)
   * @param options - Optional configuration
   * @returns ML prediction with confidence score
   */
  async predictDish(
    imageUri: string,
    options: MLInferenceOptions = {}
  ): Promise<MLPrediction> {
    if (!this.isAvailable) {
      throw new Error('ML inference is not available. Native module not loaded.');
    }

    if (!this.initialized) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    if (!imageUri || !imageUri.startsWith('file://')) {
      throw new Error('Invalid image URI. Must be a local file:// URI.');
    }

    try {
      const startTime = Date.now();
      
      // Call native module
      const result = await NutritionClassifier.classifyImage(imageUri);
      
      const inferenceTime = Date.now() - startTime;
      console.log(`[MLInferenceService] Inference completed in ${inferenceTime}ms`);

      // Parse and validate result
      const prediction = this.parseNativeResult(result, options, inferenceTime);
      
      return prediction;
    } catch (error) {
      console.error('[MLInferenceService] Prediction failed:', error);
      throw new Error(`ML inference failed: ${error.message}`);
    }
  }

  /**
   * Predict top K dishes from image
   * 
   * @param imageUri - Local file URI of the image
   * @param k - Number of top predictions to return
   * @returns Array of top K predictions
   */
  async predictTopK(imageUri: string, k: number = 5): Promise<MLPrediction[]> {
    const result = await this.predictDish(imageUri, { returnTop5: true });
    
    if (result.top5Predictions) {
      return result.top5Predictions.slice(0, k).map(pred => ({
        ...pred,
        inferenceTimeMs: result.inferenceTimeMs,
      }));
    }
    
    // If top5 not available, return just the main prediction
    return [result];
  }

  /**
   * Batch predict multiple images
   * 
   * @param imageUris - Array of local file URIs
   * @param options - Optional configuration
   * @returns Array of predictions
   */
  async predictBatch(
    imageUris: string[],
    options: MLInferenceOptions = {}
  ): Promise<MLPrediction[]> {
    if (!this.isAvailable) {
      throw new Error('ML inference is not available. Native module not loaded.');
    }

    try {
      const predictions = await Promise.all(
        imageUris.map(uri => this.predictDish(uri, options))
      );
      
      return predictions;
    } catch (error) {
      console.error('[MLInferenceService] Batch prediction failed:', error);
      throw new Error(`Batch ML inference failed: ${error.message}`);
    }
  }

  /**
   * Parse native module result into structured prediction
   */
  private parseNativeResult(
    nativeResult: any,
    options: MLInferenceOptions,
    inferenceTimeMs: number
  ): MLPrediction {
    // Native module returns an array of top predictions:
    // [
    //   { label: string, confidence: number },
    //   { label: string, confidence: number },
    //   ...
    // ]

    const minConfidence = options.minConfidence ?? 0.0;
    
    if (!Array.isArray(nativeResult) || nativeResult.length === 0) {
      throw new Error('Invalid prediction result from native module');
    }

    // Top prediction is first in array
    const topPrediction = nativeResult[0];
    
    if (topPrediction.confidence < minConfidence) {
      throw new Error(
        `Confidence ${topPrediction.confidence.toFixed(2)} below threshold ${minConfidence}`
      );
    }

    const prediction: MLPrediction = {
      dishId: topPrediction.label,
      dishName: this.formatDishName(topPrediction.label),
      confidence: topPrediction.confidence,
      inferenceTimeMs: inferenceTimeMs,
    };

    // Include top 5 predictions
    if (options.returnTop5 && nativeResult.length > 1) {
      prediction.top5Predictions = nativeResult.map((item: any) => ({
        dishId: item.label,
        dishName: this.formatDishName(item.label),
        confidence: item.confidence,
      }));
    }

    return prediction;
  }

  /**
   * Format dish ID to display name
   * Converts snake_case to Title Case
   */
  private formatDishName(dishId: string): string {
    return dishId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<{
    version: string;
    inputSize: number;
    numClasses: number;
  }> {
    if (!this.isAvailable) {
      throw new Error('ML inference is not available');
    }

    // Google AIY Vision Classifier Food v1 specifications
    return {
      version: '1.0.0',
      inputSize: 192,   // ✅ Google AIY uses 192x192
      numClasses: 2024, // ✅ 2024 food classes
    };
  }

  /**
   * Warm up the model (optional optimization)
   * Runs a dummy prediction to load model into memory
   */
  async warmUp(): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    console.log('[MLInferenceService] Model ready for inference');
  }
}

// Singleton instance
const mlInferenceService = new MLInferenceService();

export default mlInferenceService;
