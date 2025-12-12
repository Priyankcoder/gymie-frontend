
// User Preferences
export interface UserPreferences {
  units: 'kg' | 'lb';
  theme: 'light' | 'dark';
  stepsSync: boolean;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  stepsGoal: number;
  currentWeight?: number;
  targetWeight?: number;
}

// Workout Types
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  duration?: number; // in minutes
  notes?: string;
  completed: boolean;
  templateId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string;
  color?: string;
}

export interface TemplateExercise {
  name: string;
  targetSets: number;
  targetReps: number;
  notes?: string;
}

// Personal Record
export interface PersonalRecord {
  id: string;
  exerciseName: string;
  value: number;
  unit: 'kg' | 'lb';
  reps: number;
  date: string;
  workoutId?: string;
}

// Gym Attendance / Streak
export interface GymAttendance {
  id: string;
  date: string;
  checkedIn: boolean;
  duration?: number; // minutes
  workoutId?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  thisWeekWorkouts: number;
  thisMonthWorkouts: number;
  lastWorkoutDate?: string;
}

// Weight Log
export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lb';
  notes?: string;
}

// Meal Types
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUri?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  timestamp: number;
  isAiEstimated?: boolean;
  confidence?: number;
}

export interface DailyNutrition {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Recipe Types
export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  prepTime: number;
  cookTime: number;
}

// Health Metrics
export interface HealthMetrics {
  date: string;
  steps: number;
  heartRate?: number;
  sleepHours?: number;
  activeCalories?: number;
}

// Progress Photo
export interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  weight?: number;
  notes?: string;
}

// Exercise Database
export interface ExerciseInfo {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'other';
  muscleGroups: string[];
  equipment?: string[];
  isCompound: boolean;
}

// Exercise Progress for analytics
export interface ExerciseProgress {
  exerciseName: string;
  history: {
    date: string;
    maxWeight: number;
    totalVolume: number;
    bestSet: { reps: number; weight: number };
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MealEstimation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  suggestions?: string[];
}
