
/**
 * Formatting utility functions
 */

/**
 * Format number with commas
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format weight with unit
 */
export const formatWeight = (weight: number, unit: 'kg' | 'lb'): string => {
  return `${weight.toFixed(1)} ${unit}`;
};

/**
 * Format macros
 */
export const formatMacros = (
  protein: number,
  carbs: number,
  fat: number
): string => {
  return `P: ${protein}g | C: ${carbs}g | F: ${fat}g`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Format set notation (e.g., "3x10")
 */
export const formatSetNotation = (sets: number, reps: number | string): string => {
  return `${sets}x${reps}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
