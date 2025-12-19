
/**
 * Workout and nutrition calculation utilities
 */

import { Exercise, Workout, WorkoutSet } from '../types';

/**
 * Calculate 1 Rep Max using Epley formula
 */
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

/**
 * Calculate total volume for a workout
 */
export const calculateWorkoutVolume = (workout: Workout): number => {
  return workout.exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise);
  }, 0);
};

/**
 * Calculate volume for a single exercise
 */
export const calculateExerciseVolume = (exercise: Exercise): number => {
  return exercise.sets
    .filter(set => set.completed)
    .reduce((sum, set) => sum + (set.weight * set.reps), 0);
};

/**
 * Calculate total sets completed in a workout
 */
export const calculateTotalSets = (workout: Workout): number => {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.completed).length;
  }, 0);
};

/**
 * Calculate macro percentages
 */
export const calculateMacroPercentage = (
  current: number,
  goal: number
): number => {
  if (goal === 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

/**
 * Calculate calories from macros
 */
export const calculateCaloriesFromMacros = (
  protein: number,
  carbs: number,
  fat: number
): number => {
  return (protein * 4) + (carbs * 4) + (fat * 9);
};

/**
 * Calculate remaining macros
 */
export const calculateRemainingMacros = (
  current: number,
  goal: number
): number => {
  return Math.max(goal - current, 0);
};

/**
 * Calculate BMI with unit support
 */
export const calculateBMI = (
  weight: number,
  heightCm: number,
  units: 'kg' | 'lb' = 'kg'
): number => {
  // Convert weight to kg if needed
  const weightKg = units === 'lb' ? weight * 0.453592 : weight;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

/**
 * Get BMI category
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Convert weight between units
 */
export const convertWeight = (
  weight: number,
  from: 'kg' | 'lb',
  to: 'kg' | 'lb'
): number => {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') return weight * 2.20462;
  return weight * 0.453592;
};

/**
 * Round to nearest plate weight
 */
export const roundToNearestPlate = (
  weight: number,
  increment: number = 2.5
): number => {
  return Math.round(weight / increment) * increment;
};
