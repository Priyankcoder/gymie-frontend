
// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// User Preferences
export interface UserPreferences {
  units: 'kg' | 'lb';
  heightUnits: 'cm' | 'ft';
  theme: 'light' | 'dark';
  stepsSync: boolean;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  fiberGoal: number;
  sodiumGoal: number;
  stepsGoal: number;
  currentWeight?: number;
  targetWeight?: number;
  height?: number; // in cm
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
  category?: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'custom';
  isPrebuilt?: boolean;
}

export interface TemplateExercise {
  name: string;
  targetSets: number;
  targetReps: number | string; // Can be "8-12" range
  targetWeight?: number;
  restSeconds?: number;
  notes?: string;
  supersetWith?: string; // Exercise name to superset with
}

// ===== WORKOUT PLAN TYPES =====

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  type: 'ppl' | 'push_pull' | 'upper_lower' | 'bro_split' | 'full_body' | 'custom';
  days: WorkoutPlanDay[];
  recurrence?: PlanRecurrence;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface WorkoutPlanDay {
  id: string;
  dayIndex: number; // 0-6 for Monday-Sunday or sequential order
  name: string; // "Push Day", "Rest", etc.
  isRestDay: boolean;
  templateId?: string; // Reference to template
  exercises: TemplateExercise[];
  notes?: string;
}

export interface PlanRecurrence {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // e.g., 1 for every week, 2 for every 2 weeks
  startDate: string;
  endDate?: string; // Optional end date
  restDays: number[]; // Day indices that are rest days (0=Sunday, 1=Monday, etc.)
  excludedDates?: string[]; // Specific dates to skip
}

export interface ScheduledWorkout {
  id: string;
  planId: string;
  planDayId: string;
  date: string;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  workoutId?: string; // Reference to completed workout
  notes?: string;
}

// Prebuilt template structures
export interface PrebuiltPlanTemplate {
  id: string;
  name: string;
  description: string;
  type: WorkoutPlan['type'];
  daysPerWeek: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'fat_loss' | 'general';
  days: Omit<WorkoutPlanDay, 'id'>[];
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
  fiber: number;
  sodium: number;
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
  totalFiber: number;
  totalSodium: number;
}

// Nutrition Day (for backend API)
export interface NutritionDay {
  id: number;
  userId: number;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSodium: number;
  createdAt?: string;
  updatedAt?: string;
}

// Weight Entry (for backend API)
export interface WeightEntry {
  id: number;
  userId: number;
  date: string;
  weight: number;
  unit: 'kg' | 'lb';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  fiber: number;
  sodium: number;
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
  uri: string; // Local file path
  cloudUrl?: string; // Cloud storage URL (if synced)
  date: string;
  weight?: number;
  notes?: string;
  synced?: boolean; // Whether photo has been uploaded to cloud
  syncedAt?: string; // When photo was last synced
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
  fiber: number;
  sodium: number;
  confidence: number;
  suggestions?: string[];
}
