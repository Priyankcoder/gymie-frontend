
import { storage } from '../services/localStorage';
import {
  Workout,
  Meal,
  PersonalRecord,
  HealthMetrics,
  ProgressPhoto,
  UserPreferences,
} from '../types';

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const seedWorkouts: Workout[] = [
  {
    id: generateId(),
    date: getDateDaysAgo(0),
    name: 'Push Day',
    exercises: [
      {
        id: generateId(),
        name: 'Bench Press',
        sets: [
          { id: generateId(), reps: 10, weight: 60, completed: true },
          { id: generateId(), reps: 8, weight: 70, completed: true },
          { id: generateId(), reps: 6, weight: 80, completed: true },
          { id: generateId(), reps: 6, weight: 80, rpe: 9, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Overhead Press',
        sets: [
          { id: generateId(), reps: 10, weight: 40, completed: true },
          { id: generateId(), reps: 8, weight: 45, completed: true },
          { id: generateId(), reps: 8, weight: 45, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Dumbbell Fly',
        sets: [
          { id: generateId(), reps: 12, weight: 14, completed: true },
          { id: generateId(), reps: 12, weight: 14, completed: true },
          { id: generateId(), reps: 10, weight: 16, completed: true },
        ],
      },
    ],
    duration: 55,
    completed: true,
  },
  {
    id: generateId(),
    date: getDateDaysAgo(1),
    name: 'Pull Day',
    exercises: [
      {
        id: generateId(),
        name: 'Deadlift',
        sets: [
          { id: generateId(), reps: 5, weight: 100, completed: true },
          { id: generateId(), reps: 5, weight: 120, completed: true },
          { id: generateId(), reps: 3, weight: 140, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Barbell Row',
        sets: [
          { id: generateId(), reps: 10, weight: 60, completed: true },
          { id: generateId(), reps: 8, weight: 70, completed: true },
          { id: generateId(), reps: 8, weight: 70, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Pull Ups',
        sets: [
          { id: generateId(), reps: 10, weight: 0, completed: true },
          { id: generateId(), reps: 8, weight: 0, completed: true },
          { id: generateId(), reps: 6, weight: 0, completed: true },
        ],
      },
    ],
    duration: 50,
    completed: true,
  },
  {
    id: generateId(),
    date: getDateDaysAgo(3),
    name: 'Leg Day',
    exercises: [
      {
        id: generateId(),
        name: 'Squat',
        sets: [
          { id: generateId(), reps: 8, weight: 80, completed: true },
          { id: generateId(), reps: 8, weight: 100, completed: true },
          { id: generateId(), reps: 6, weight: 110, completed: true },
          { id: generateId(), reps: 6, weight: 110, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Romanian Deadlift',
        sets: [
          { id: generateId(), reps: 10, weight: 60, completed: true },
          { id: generateId(), reps: 10, weight: 70, completed: true },
          { id: generateId(), reps: 8, weight: 80, completed: true },
        ],
      },
      {
        id: generateId(),
        name: 'Leg Press',
        sets: [
          { id: generateId(), reps: 12, weight: 140, completed: true },
          { id: generateId(), reps: 10, weight: 160, completed: true },
          { id: generateId(), reps: 10, weight: 160, completed: true },
        ],
      },
    ],
    duration: 60,
    completed: true,
  },
];

export const seedMeals: Meal[] = [
  {
    id: generateId(),
    name: 'Oatmeal with Banana',
    calories: 380,
    protein: 12,
    carbs: 65,
    fat: 8,
    fiber: 8,
    sodium: 150,
    mealType: 'breakfast',
    date: getDateDaysAgo(0),
    timestamp: Date.now(),
  },
  {
    id: generateId(),
    name: 'Grilled Chicken Salad',
    calories: 450,
    protein: 42,
    carbs: 20,
    fat: 22,
    fiber: 6,
    sodium: 580,
    mealType: 'lunch',
    date: getDateDaysAgo(0),
    timestamp: Date.now(),
  },
  {
    id: generateId(),
    name: 'Protein Shake',
    calories: 220,
    protein: 30,
    carbs: 15,
    fat: 5,
    fiber: 2,
    sodium: 180,
    mealType: 'snack',
    date: getDateDaysAgo(0),
    timestamp: Date.now(),
  },
  {
    id: generateId(),
    name: 'Salmon with Rice',
    calories: 620,
    protein: 45,
    carbs: 55,
    fat: 24,
    fiber: 3,
    sodium: 650,
    mealType: 'dinner',
    date: getDateDaysAgo(0),
    timestamp: Date.now(),
  },
  {
    id: generateId(),
    name: 'Eggs and Toast',
    calories: 350,
    protein: 20,
    carbs: 30,
    fat: 16,
    fiber: 3,
    sodium: 420,
    mealType: 'breakfast',
    date: getDateDaysAgo(1),
    timestamp: Date.now() - 86400000,
  },
  {
    id: generateId(),
    name: 'Turkey Sandwich',
    calories: 480,
    protein: 35,
    carbs: 45,
    fat: 18,
    fiber: 4,
    sodium: 820,
    mealType: 'lunch',
    date: getDateDaysAgo(1),
    timestamp: Date.now() - 86400000,
  },
];

export const seedPersonalRecords: PersonalRecord[] = [
  {
    id: generateId(),
    exerciseName: 'Bench Press',
    value: 100,
    unit: 'kg',
    reps: 1,
    date: getDateDaysAgo(7),
  },
  {
    id: generateId(),
    exerciseName: 'Bench Press',
    value: 80,
    unit: 'kg',
    reps: 5,
    date: getDateDaysAgo(14),
  },
  {
    id: generateId(),
    exerciseName: 'Squat',
    value: 140,
    unit: 'kg',
    reps: 1,
    date: getDateDaysAgo(10),
  },
  {
    id: generateId(),
    exerciseName: 'Squat',
    value: 110,
    unit: 'kg',
    reps: 5,
    date: getDateDaysAgo(3),
  },
  {
    id: generateId(),
    exerciseName: 'Deadlift',
    value: 180,
    unit: 'kg',
    reps: 1,
    date: getDateDaysAgo(5),
  },
  {
    id: generateId(),
    exerciseName: 'Deadlift',
    value: 140,
    unit: 'kg',
    reps: 5,
    date: getDateDaysAgo(1),
  },
  {
    id: generateId(),
    exerciseName: 'Overhead Press',
    value: 60,
    unit: 'kg',
    reps: 1,
    date: getDateDaysAgo(12),
  },
];

export const seedHealthMetrics: HealthMetrics[] = [
  { date: getDateDaysAgo(0), steps: 8432, heartRate: 68, sleepHours: 7.5, activeCalories: 420 },
  { date: getDateDaysAgo(1), steps: 10251, heartRate: 72, sleepHours: 6.8, activeCalories: 510 },
  { date: getDateDaysAgo(2), steps: 6890, heartRate: 65, sleepHours: 8.2, activeCalories: 350 },
  { date: getDateDaysAgo(3), steps: 12340, heartRate: 75, sleepHours: 7.0, activeCalories: 620 },
  { date: getDateDaysAgo(4), steps: 9876, heartRate: 70, sleepHours: 7.3, activeCalories: 480 },
  { date: getDateDaysAgo(5), steps: 5432, heartRate: 63, sleepHours: 8.5, activeCalories: 280 },
  { date: getDateDaysAgo(6), steps: 11234, heartRate: 74, sleepHours: 6.5, activeCalories: 550 },
];

export const seedPreferences: UserPreferences = {
  units: 'kg',
  heightUnits: 'cm',
  theme: 'dark',
  stepsSync: true,
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
  fiberGoal: 25,
  sodiumGoal: 2300,
  stepsGoal: 10000,
};

export async function seedDatabase() {
  console.log('Seeding database...');

  await storage.set(storage.keys.USER_PREFERENCES, seedPreferences);
  await storage.set(storage.keys.WORKOUTS, seedWorkouts);
  await storage.set(storage.keys.MEALS, seedMeals);
  await storage.set(storage.keys.PERSONAL_RECORDS, seedPersonalRecords);
  await storage.set(storage.keys.HEALTH_METRICS, seedHealthMetrics);
  await storage.set(storage.keys.PROGRESS_PHOTOS, []);

  console.log('Database seeded successfully!');
}

export async function clearDatabase() {
  console.log('Clearing database...');
  await storage.clear();
  console.log('Database cleared!');
}
