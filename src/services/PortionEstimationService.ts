
/**
 * Portion Estimation Service
 * 
 * Rule-based heuristic for estimating portion sizes from images.
 * No ML required - uses simple image area calculations.
 * 
 * Based on: OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md
 */

export type PortionSize = 'small' | 'medium' | 'large';

export interface PortionEstimateResult {
  portion: PortionSize;
  dishRatio: number;
  confidence: number;
  method: 'area_heuristic';
}

export interface ImageDimensions {
  width: number;
  height: number;
  dishArea?: number; // Optional: from object detection
}

/**
 * Portion multipliers for nutrition calculation
 */
export const PORTION_MULTIPLIERS: Record<PortionSize, number> = {
  small: 0.75,
  medium: 1.0,
  large: 1.3,
};

/**
 * Portion thresholds (tuned from user studies)
 */
const PORTION_THRESHOLDS = {
  small: 0.15,  // < 15% of image
  medium: 0.35, // 15-35% of image
  // large: > 35% of image
};

class PortionEstimationService {
  /**
   * Estimate portion size from image dimensions
   * 
   * @param dimensions - Image width, height, and optional dish area
   * @returns Portion estimate with confidence
   */
  estimatePortion(dimensions: ImageDimensions): PortionEstimateResult {
    const { width, height, dishArea } = dimensions;
    
    const totalPixels = width * height;
    
    // If dish area provided (from object detection), use it
    // Otherwise, estimate from center region (common case)
    const effectiveDishArea = dishArea ?? this.estimateCenterArea(width, height);
    
    const dishRatio = effectiveDishArea / totalPixels;
    
    // Apply thresholds
    let portion: PortionSize;
    let confidence: number;
    
    if (dishRatio < PORTION_THRESHOLDS.small) {
      portion = 'small';
      confidence = this.calculateConfidence(dishRatio, 0, PORTION_THRESHOLDS.small);
    } else if (dishRatio < PORTION_THRESHOLDS.medium) {
      portion = 'medium';
      confidence = this.calculateConfidence(
        dishRatio,
        PORTION_THRESHOLDS.small,
        PORTION_THRESHOLDS.medium
      );
    } else {
      portion = 'large';
      confidence = this.calculateConfidence(dishRatio, PORTION_THRESHOLDS.medium, 1.0);
    }
    
    return {
      portion,
      dishRatio,
      confidence,
      method: 'area_heuristic',
    };
  }
  
  /**
   * Estimate dish area from center region (when no object detection)
   * Assumes food is centered in frame (common photography pattern)
   */
  private estimateCenterArea(width: number, height: number): number {
    // Assume dish occupies center 60% of image (heuristic)
    const centerRatio = 0.6;
    const centerWidth = width * centerRatio;
    const centerHeight = height * centerRatio;
    return centerWidth * centerHeight;
  }
  
  /**
   * Calculate confidence based on distance from threshold boundaries
   * Higher confidence when ratio is clearly in one category
   */
  private calculateConfidence(
    ratio: number,
    lowerBound: number,
    upperBound: number
  ): number {
    const range = upperBound - lowerBound;
    const midpoint = (lowerBound + upperBound) / 2;
    const distanceFromMidpoint = Math.abs(ratio - midpoint);
    
    // Normalize to 0.6-0.95 range
    // (We never return 100% confidence since it's heuristic-based)
    const normalizedDistance = distanceFromMidpoint / (range / 2);
    return 0.6 + (1 - normalizedDistance) * 0.35;
  }
  
  /**
   * Get portion multiplier for nutrition calculation
   */
  getMultiplier(portion: PortionSize): number {
    return PORTION_MULTIPLIERS[portion];
  }
  
  /**
   * Validate if dish area makes sense (sanity check)
   */
  isReasonableDishArea(dishArea: number, totalArea: number): boolean {
    const ratio = dishArea / totalArea;
    // Dish should be at least 5% and at most 95% of image
    return ratio >= 0.05 && ratio <= 0.95;
  }
  
  /**
   * Format portion size for display
   */
  formatPortion(portion: PortionSize): string {
    const labels: Record<PortionSize, string> = {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
    };
    return labels[portion];
  }
  
  /**
   * Get serving size description
   */
  getServingDescription(portion: PortionSize): string {
    const descriptions: Record<PortionSize, string> = {
      small: 'About 3/4 of a standard serving',
      medium: 'Standard serving size',
      large: 'About 1.3x a standard serving',
    };
    return descriptions[portion];
  }
}

// Export singleton instance
export const portionEstimationService = new PortionEstimationService();
export default portionEstimationService;
