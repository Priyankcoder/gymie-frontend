/**
 * ML Inference Service
 * 
 * Handles on-device machine learning inference for food recognition.
 * Uses platform-specific models:
 * - Android: TensorFlow Lite (.tflite)
 * - iOS: CoreML (.mlmodel)
 * - Web: ONNX (future)
 */

import { NativeModules, Platform } from 'react-native';

const { NutritionClassifier } = NativeModules;

export interface MLPrediction {
  dishId: string;
  dishName: string;
  confidence: number;
  inferenceTimeMs: number;
}

export interface MLConfig {
  confidenceThreshold: number;
  maxPredictions: number;
  useGPU: boolean;
}

class MLInferenceService {
  private initialized = false;
  private config: MLConfig = {
    confidenceThreshold: 0.75,
    maxPredictions: 3,
    useGPU: false, // CPU-only for consistency
  };

  /**
   * Initialize the ML service
   */
  async initialize(config?: Partial<MLConfig>): Promise<void> {
    if (this.initialized) {
      console.log('[MLInference] Already initialized');
      return;
    }

    // Update config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Web platform not supported yet
    if (Platform.OS === 'web') {
      console.log('[MLInference] Web platform - ML not available yet');
      this.initialized = true;
      return;
    }

    // Check if native module exists
    if (!NutritionClassifier) {
      console.warn('[MLInference] Native module not available');
      throw new Error('ML native module not found. Ensure native modules are linked.');
    }

    try {
      await NutritionClassifier.initialize();
      this.initialized = true;
      console.log('[MLInference] Service initialized successfully');
    } catch (error) {
      console.error('[MLInference] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Predict dish from image
   * @param imageUri - Local file URI of the image
   * @returns Prediction result with dish ID and confidence
   */
  async predictDish(imageUri: string): Promise<MLPrediction> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web') {
      throw new Error('ML inference not supported on web platform yet');
    }

    if (!NutritionClassifier) {
      throw new Error('Native ML module not available');
    }

    try {
      const startTime = Date.now();
      const result = await NutritionClassifier.classify(imageUri);
      const totalTime = Date.now() - startTime;

      console.log(`[MLInference] Prediction complete in ${totalTime}ms:`, {
        dishId: result.dishId,
        confidence: result.confidence.toFixed(3),
      });

      return {
        dishId: result.dishId,
        dishName: result.dishName || result.dishId.replace(/_/g, ' '),
        confidence: result.confidence,
        inferenceTimeMs: result.inferenceTimeMs || totalTime,
      };
    } catch (error) {
      console.error('[MLInference] Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Get multiple predictions (top-k results)
   * @param imageUri - Local file URI of the image
   * @param k - Number of top predictions to return
   */
  async predictTopK(imageUri: string, k: number = 3): Promise<MLPrediction[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web') {
      throw new Error('ML inference not supported on web platform yet');
    }

    if (!NutritionClassifier?.classifyTopK) {
      // Fallback to single prediction
      const single = await this.predictDish(imageUri);
      return [single];
    }

    try {
      const results = await NutritionClassifier.classifyTopK(imageUri, k);
      console.log(`[MLInference] Top-${k} predictions:`, results);
      return results;
    } catch (error) {
      console.error('[MLInference] Top-K prediction failed:', error);
      throw error;
    }
  }

  /**
   * Check if prediction confidence meets threshold
   */
  isHighConfidence(prediction: MLPrediction): boolean {
    return prediction.confidence >= this.config.confidenceThreshold;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): MLConfig {
    return { ...this.config };
  }

  /**
   * Check if ML is available on current platform
   */
  isAvailable(): boolean {
    if (Platform.OS === 'web') {
      return false;
    }
    return !!NutritionClassifier;
  }
}

// Export singleton instance
export const mlInferenceService = new MLInferenceService();
export default mlInferenceService;
