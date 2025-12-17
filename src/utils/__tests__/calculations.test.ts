
import {
  calculateOneRepMax,
  calculateWorkoutVolume,
  calculateExerciseVolume,
  calculateTotalSets,
  calculateBMI,
  getBMICategory,
  convertWeight,
  roundToNearestPlate,
} from '../calculations';
import { Workout, Exercise } from '../../types';

describe('Calculation Utilities', () => {
  describe('calculateOneRepMax', () => {
    it('returns weight for 1 rep', () => {
      expect(calculateOneRepMax(100, 1)).toBe(100);
    });

    it('calculates 1RM correctly for 5 reps', () => {
      expect(calculateOneRepMax(100, 5)).toBe(117);
    });

    it('calculates 1RM correctly for 10 reps', () => {
      expect(calculateOneRepMax(100, 10)).toBe(133);
    });

    it('handles zero weight', () => {
      expect(calculateOneRepMax(0, 5)).toBe(0);
    });

    it('handles high rep ranges', () => {
      const result = calculateOneRepMax(50, 20);
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(100);
    });

    it('returns rounded integer', () => {
      const result = calculateOneRepMax(100, 5);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateExerciseVolume', () => {
    it('calculates volume for single set', () => {
      const exercise: Exercise = {
        id: '1',
        name: 'Bench Press',
        sets: [{ weight: 100, reps: 10, completed: true }],
      };
      expect(calculateExerciseVolume(exercise)).toBe(1000);
    });

    it('calculates volume for multiple sets', () => {
      const exercise: Exercise = {
        id: '1',
        name: 'Squat',
        sets: [
          { weight: 100, reps: 10, completed: true },
          { weight: 100, reps: 8, completed: true },
          { weight: 100, reps: 6, completed: true },
        ],
      };
      expect(calculateExerciseVolume(exercise)).toBe(2400);
    });

    it('ignores incomplete sets', () => {
      const exercise: Exercise = {
        id: '1',
        name: 'Deadlift',
        sets: [
          { weight: 100, reps: 10, completed: true },
          { weight: 100, reps: 10, completed: false },
        ],
      };
      expect(calculateExerciseVolume(exercise)).toBe(1000);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('calculates volume for single exercise', () => {
      const workout: Workout = {
        id: '1',
        date: '2025-01-01',
        exercises: [
          {
            id: '1',
            name: 'Bench Press',
            sets: [{ weight: 100, reps: 10, completed: true }],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(1000);
    });

    it('calculates volume for multiple exercises', () => {
      const workout: Workout = {
        id: '1',
        date: '2025-01-01',
        exercises: [
          {
            id: '1',
            name: 'Bench Press',
            sets: [
              { weight: 100, reps: 10, completed: true },
              { weight: 100, reps: 8, completed: true },
            ],
          },
          {
            id: '2',
            name: 'Squat',
            sets: [{ weight: 150, reps: 5, completed: true }],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(2550);
    });

    it('ignores incomplete sets', () => {
      const workout: Workout = {
        id: '1',
        date: '2025-01-01',
        exercises: [
          {
            id: '1',
            name: 'Bench Press',
            sets: [
              { weight: 100, reps: 10, completed: true },
              { weight: 100, reps: 10, completed: false },
            ],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(1000);
    });

    it('handles empty exercises array', () => {
      const workout: Workout = {
        id: '1',
        date: '2025-01-01',
        exercises: [],
      };
      expect(calculateWorkoutVolume(workout)).toBe(0);
    });

    it('handles zero weight or reps', () => {
      const workout: Workout = {
        id: '1',
        date: '2025-01-01',
        exercises: [
          {
            id: '1',
            name: 'Test',
            sets: [
              { weight: 0, reps: 10, completed: true },
              { weight: 100, reps: 0, completed: true },
            ],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(0);
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      const bmi = calculateBMI(70, 175);
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    it('handles different heights', () => {
      const bmi = calculateBMI(80, 180);
      expect(bmi).toBeCloseTo(24.69, 2);
    });

    it('returns Infinity for zero height', () => {
      expect(calculateBMI(70, 0)).toBe(Infinity);
    });

    it('returns 0 for zero weight', () => {
      expect(calculateBMI(0, 175)).toBe(0);
    });
  });

  describe('getBMICategory', () => {
    it('returns Underweight for BMI < 18.5', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(18.4)).toBe('Underweight');
    });

    it('returns Normal for BMI 18.5-24.9', () => {
      expect(getBMICategory(18.5)).toBe('Normal');
      expect(getBMICategory(22)).toBe('Normal');
      expect(getBMICategory(24.9)).toBe('Normal');
    });

    it('returns Overweight for BMI 25-29.9', () => {
      expect(getBMICategory(25)).toBe('Overweight');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(29.9)).toBe('Overweight');
    });

    it('returns Obese for BMI >= 30', () => {
      expect(getBMICategory(30)).toBe('Obese');
      expect(getBMICategory(35)).toBe('Obese');
      expect(getBMICategory(40)).toBe('Obese');
    });

    it('handles edge cases', () => {
      expect(getBMICategory(0)).toBe('Underweight');
      expect(getBMICategory(100)).toBe('Obese');
    });
  });

  describe('convertWeight', () => {
    it('converts kg to lb correctly', () => {
      expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.46, 2);
    });

    it('converts lb to kg correctly', () => {
      expect(convertWeight(220, 'lb', 'kg')).toBeCloseTo(99.79, 2);
    });

    it('returns same value for same unit (kg)', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100);
    });

    it('returns same value for same unit (lb)', () => {
      expect(convertWeight(100, 'lb', 'lb')).toBe(100);
    });

    it('handles zero weight', () => {
      expect(convertWeight(0, 'kg', 'lb')).toBe(0);
      expect(convertWeight(0, 'lb', 'kg')).toBe(0);
    });

    it('handles decimal weights', () => {
      const result = convertWeight(75.5, 'kg', 'lb');
      expect(result).toBeGreaterThan(166);
      expect(result).toBeLessThan(167);
    });

    it('is reversible', () => {
      const original = 100;
      const converted = convertWeight(original, 'kg', 'lb');
      const backConverted = convertWeight(converted, 'lb', 'kg');
      expect(backConverted).toBeCloseTo(original, 1);
    });
  });
});
