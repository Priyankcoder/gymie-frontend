
/**
 * ML Inference Service - Web Implementation (Stub)
 * 
 * Web implementation currently returns mock/unavailable status.
 * TODO: Implement ONNX Runtime Web integration
 */

import { MLPrediction, MLInferenceOptions } from './mlInferenceService';

class MLInferenceServiceWeb {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[MLInferenceWeb] Already initialized');
      return;
    }

    console.warn('[MLInferenceWeb] ML functionality not available on web platform yet');
    this.initialized = true;
  }

  public isAvailable(): boolean {
    return false; // ML not available on web yet
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  async predictDish(
    imageUri: string,
    options: MLInferenceOptions = {}
  ): Promise<MLPrediction> {
    throw new Error('ML inference is not available on web platform. Please use the mobile app for food recognition.');
  }

  async predictTopK(imageUri: string, k: number = 5): Promise<MLPrediction[]> {
    throw new Error('ML inference is not available on web platform. Please use the mobile app for food recognition.');
  }

  private formatDishName(dishId: string): string {
    return dishId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async getModelInfo() {
    return {
      version: '1.0.0-web-stub',
      inputSize: 224,
      numClasses: 0,
      backend: 'unavailable',
    };
  }

  async warmUp(): Promise<void> {
    console.log('[MLInferenceWeb] Warm-up skipped (ML not available on web)');
  }
}

const mlInferenceService = new MLInferenceServiceWeb();

export default mlInferenceService;
