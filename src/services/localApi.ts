
import { storage } from './localStorage';
import {
  Workout,
  WorkoutTemplate,
  PersonalRecord,
  Meal,
  MealEstimation,
  Recipe,
  HealthMetrics,
  ProgressPhoto,
  UserPreferences,
  ExerciseInfo,
  ApiResponse,
} from '../types';

// Utility to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(200 + Math.random() * 400);

// Generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Default User Preferences
const defaultPreferences: UserPreferences = {
  units: 'kg',
  theme: 'dark',
  stepsSync: false,
  calorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
  stepsGoal: 10000,
};

// Local API Implementation
export const localApi = {
  // ==================== User Preferences ====================
  preferences: {
    async get(): Promise<ApiResponse<UserPreferences>> {
      await randomDelay();
      const prefs = await storage.get<UserPreferences>(storage.keys.USER_PREFERENCES);
      return {
        success: true,
        data: prefs || defaultPreferences,
      };
    },

    async update(updates: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
      await randomDelay();
      const current = await storage.get<UserPreferences>(storage.keys.USER_PREFERENCES) || defaultPreferences;
      const updated = { ...current, ...updates };
      await storage.set(storage.keys.USER_PREFERENCES, updated);
      return { success: true, data: updated };
    },
  },

  // ==================== Workouts ====================
  workouts: {
    async getAll(): Promise<ApiResponse<Workout[]>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS);
      return { success: true, data: workouts || [] };
    },

    async getById(id: string): Promise<ApiResponse<Workout | null>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const workout = workouts.find(w => w.id === id) || null;
      return { success: true, data: workout };
    },

    async getByDate(date: string): Promise<ApiResponse<Workout[]>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const filtered = workouts.filter(w => w.date === date);
      return { success: true, data: filtered };
    },

    async create(workout: Omit<Workout, 'id'>): Promise<ApiResponse<Workout>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const newWorkout: Workout = { ...workout, id: generateId() };
      workouts.push(newWorkout);
      await storage.set(storage.keys.WORKOUTS, workouts);
      
      // Check for new PRs
      await localApi.prs.checkAndUpdate(newWorkout);
      
      return { success: true, data: newWorkout };
    },

    async update(id: string, updates: Partial<Workout>): Promise<ApiResponse<Workout | null>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const index = workouts.findIndex(w => w.id === id);
      if (index === -1) {
        return { success: false, error: 'Workout not found' };
      }
      workouts[index] = { ...workouts[index], ...updates };
      await storage.set(storage.keys.WORKOUTS, workouts);
      return { success: true, data: workouts[index] };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const filtered = workouts.filter(w => w.id !== id);
      await storage.set(storage.keys.WORKOUTS, filtered);
      return { success: true, data: true };
    },
  },

  // ==================== Workout Templates ====================
  templates: {
    async getAll(): Promise<ApiResponse<WorkoutTemplate[]>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES);
      return { success: true, data: templates || [] };
    },

    async create(template: Omit<WorkoutTemplate, 'id'>): Promise<ApiResponse<WorkoutTemplate>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES) || [];
      const newTemplate: WorkoutTemplate = { ...template, id: generateId() };
      templates.push(newTemplate);
      await storage.set(storage.keys.WORKOUT_TEMPLATES, templates);
      return { success: true, data: newTemplate };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES) || [];
      const filtered = templates.filter(t => t.id !== id);
      await storage.set(storage.keys.WORKOUT_TEMPLATES, filtered);
      return { success: true, data: true };
    },
  },

  // ==================== Personal Records ====================
  prs: {
    async getAll(): Promise<ApiResponse<PersonalRecord[]>> {
      await randomDelay();
      const prs = await storage.get<PersonalRecord[]>(storage.keys.PERSONAL_RECORDS);
      return { success: true, data: prs || [] };
    },

    async getByExercise(exerciseName: string): Promise<ApiResponse<PersonalRecord[]>> {
      await randomDelay();
      const prs = await storage.get<PersonalRecord[]>(storage.keys.PERSONAL_RECORDS) || [];
      const filtered = prs.filter(p => p.exerciseName.toLowerCase() === exerciseName.toLowerCase());
      return { success: true, data: filtered };
    },

    async checkAndUpdate(workout: Workout): Promise<PersonalRecord[]> {
      const prs = await storage.get<PersonalRecord[]>(storage.keys.PERSONAL_RECORDS) || [];
      const newPRs: PersonalRecord[] = [];

      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (!set.completed) continue;

          const existingPR = prs.find(
            p => p.exerciseName.toLowerCase() === exercise.name.toLowerCase() && p.reps === set.reps
          );

          if (!existingPR || set.weight > existingPR.value) {
            const newPR: PersonalRecord = {
              id: generateId(),
              exerciseName: exercise.name,
              value: set.weight,
              unit: 'kg', // TODO: Get from preferences
              reps: set.reps,
              date: workout.date,
              workoutId: workout.id,
            };

            if (existingPR) {
              const index = prs.findIndex(p => p.id === existingPR.id);
              prs[index] = newPR;
            } else {
              prs.push(newPR);
            }
            newPRs.push(newPR);
          }
        }
      }

      if (newPRs.length > 0) {
        await storage.set(storage.keys.PERSONAL_RECORDS, prs);
      }

      return newPRs;
    },
  },

  // ==================== Meals ====================
  meals: {
    async getAll(): Promise<ApiResponse<Meal[]>> {
      await randomDelay();
      const meals = await storage.get<Meal[]>(storage.keys.MEALS);
      return { success: true, data: meals || [] };
    },

    async getByDate(date: string): Promise<ApiResponse<Meal[]>> {
      await randomDelay();
      const meals = await storage.get<Meal[]>(storage.keys.MEALS) || [];
      const filtered = meals.filter(m => m.date === date);
      return { success: true, data: filtered };
    },

    async create(meal: Omit<Meal, 'id'>): Promise<ApiResponse<Meal>> {
      await randomDelay();
      const meals = await storage.get<Meal[]>(storage.keys.MEALS) || [];
      const newMeal: Meal = { ...meal, id: generateId() };
      meals.push(newMeal);
      await storage.set(storage.keys.MEALS, meals);
      return { success: true, data: newMeal };
    },

    async update(id: string, updates: Partial<Meal>): Promise<ApiResponse<Meal | null>> {
      await randomDelay();
      const meals = await storage.get<Meal[]>(storage.keys.MEALS) || [];
      const index = meals.findIndex(m => m.id === id);
      if (index === -1) {
        return { success: false, error: 'Meal not found' };
      }
      meals[index] = { ...meals[index], ...updates };
      await storage.set(storage.keys.MEALS, meals);
      return { success: true, data: meals[index] };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      await randomDelay();
      const meals = await storage.get<Meal[]>(storage.keys.MEALS) || [];
      const filtered = meals.filter(m => m.id !== id);
      await storage.set(storage.keys.MEALS, filtered);
      return { success: true, data: true };
    },

    // Mock AI Meal Estimation
    async estimateFromImage(imageUri: string): Promise<ApiResponse<MealEstimation>> {
      await delay(800 + Math.random() * 700); // Longer delay for "AI processing"
      
      // Generate realistic random values
      const calories = Math.floor(300 + Math.random() * 500);
      const protein = Math.floor(15 + Math.random() * 35);
      const carbs = Math.floor(30 + Math.random() * 70);
      const fat = Math.floor(8 + Math.random() * 30);
      const confidence = 0.7 + Math.random() * 0.25;

      return {
        success: true,
        data: {
          calories,
          protein,
          carbs,
          fat,
          confidence,
          suggestions: [
            'Grilled Chicken Breast',
            'Steamed Rice',
            'Mixed Vegetables',
          ],
        },
      };
    },
  },

  // ==================== Recipes ====================
  recipes: {
    async getAll(): Promise<ApiResponse<Recipe[]>> {
      await randomDelay();
      const recipes = await storage.get<Recipe[]>(storage.keys.RECIPES);
      return { success: true, data: recipes || [] };
    },

    async generateFromIngredients(ingredients: string[]): Promise<ApiResponse<Recipe[]>> {
      await delay(1000 + Math.random() * 500);

      // Mock recipe generation
      const mockRecipes: Recipe[] = [
        {
          id: generateId(),
          name: `${ingredients[0] || 'Healthy'} Power Bowl`,
          ingredients: [...ingredients, 'Olive oil', 'Salt', 'Pepper', 'Garlic'],
          instructions: [
            'Prepare all ingredients',
            'Heat olive oil in a pan',
            'Cook main ingredients until done',
            'Season with salt and pepper',
            'Serve warm',
          ],
          calories: Math.floor(350 + Math.random() * 200),
          protein: Math.floor(25 + Math.random() * 20),
          carbs: Math.floor(40 + Math.random() * 30),
          fat: Math.floor(10 + Math.random() * 15),
          servings: 2,
          prepTime: 15,
          cookTime: 20,
        },
        {
          id: generateId(),
          name: `Simple ${ingredients[0] || 'Protein'} Stir Fry`,
          ingredients: [...ingredients, 'Soy sauce', 'Ginger', 'Sesame oil'],
          instructions: [
            'Chop all ingredients',
            'Heat sesame oil in a wok',
            'Stir fry ingredients on high heat',
            'Add soy sauce and ginger',
            'Serve over rice or noodles',
          ],
          calories: Math.floor(300 + Math.random() * 150),
          protein: Math.floor(20 + Math.random() * 15),
          carbs: Math.floor(35 + Math.random() * 25),
          fat: Math.floor(8 + Math.random() * 12),
          servings: 2,
          prepTime: 10,
          cookTime: 15,
        },
      ];

      return { success: true, data: mockRecipes };
    },
  },

  // ==================== Health Metrics ====================
  metrics: {
    async getByDate(date: string): Promise<ApiResponse<HealthMetrics | null>> {
      await randomDelay();
      const metrics = await storage.get<HealthMetrics[]>(storage.keys.HEALTH_METRICS) || [];
      const found = metrics.find(m => m.date === date) || null;
      return { success: true, data: found };
    },

    async getRange(startDate: string, endDate: string): Promise<ApiResponse<HealthMetrics[]>> {
      await randomDelay();
      const metrics = await storage.get<HealthMetrics[]>(storage.keys.HEALTH_METRICS) || [];
      const filtered = metrics.filter(m => m.date >= startDate && m.date <= endDate);
      return { success: true, data: filtered };
    },

    async update(date: string, updates: Partial<HealthMetrics>): Promise<ApiResponse<HealthMetrics>> {
      await randomDelay();
      const metrics = await storage.get<HealthMetrics[]>(storage.keys.HEALTH_METRICS) || [];
      const index = metrics.findIndex(m => m.date === date);
      
      if (index === -1) {
        const newMetric: HealthMetrics = { date, steps: 0, ...updates };
        metrics.push(newMetric);
        await storage.set(storage.keys.HEALTH_METRICS, metrics);
        return { success: true, data: newMetric };
      }
      
      metrics[index] = { ...metrics[index], ...updates };
      await storage.set(storage.keys.HEALTH_METRICS, metrics);
      return { success: true, data: metrics[index] };
    },

    // Mock sync with health providers
    async syncFromDevice(): Promise<ApiResponse<HealthMetrics>> {
      await delay(500 + Math.random() * 300);
      
      const today = new Date().toISOString().split('T')[0];
      const mockData: HealthMetrics = {
        date: today,
        steps: Math.floor(3000 + Math.random() * 7000),
        heartRate: Math.floor(60 + Math.random() * 30),
        sleepHours: 6 + Math.random() * 2,
        activeCalories: Math.floor(150 + Math.random() * 350),
      };

      await localApi.metrics.update(today, mockData);
      return { success: true, data: mockData };
    },
  },

  // ==================== Progress Photos ====================
  photos: {
    async getAll(): Promise<ApiResponse<ProgressPhoto[]>> {
      await randomDelay();
      const photos = await storage.get<ProgressPhoto[]>(storage.keys.PROGRESS_PHOTOS);
      return { success: true, data: photos || [] };
    },

    async create(photo: Omit<ProgressPhoto, 'id'>): Promise<ApiResponse<ProgressPhoto>> {
      await randomDelay();
      const photos = await storage.get<ProgressPhoto[]>(storage.keys.PROGRESS_PHOTOS) || [];
      const newPhoto: ProgressPhoto = { ...photo, id: generateId() };
      photos.push(newPhoto);
      await storage.set(storage.keys.PROGRESS_PHOTOS, photos);
      return { success: true, data: newPhoto };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      await randomDelay();
      const photos = await storage.get<ProgressPhoto[]>(storage.keys.PROGRESS_PHOTOS) || [];
      const filtered = photos.filter(p => p.id !== id);
      await storage.set(storage.keys.PROGRESS_PHOTOS, filtered);
      return { success: true, data: true };
    },
  },

  // ==================== Exercise Database ====================
  exercises: {
    async getAll(): Promise<ApiResponse<ExerciseInfo[]>> {
      await randomDelay();
      const exercises = await storage.get<ExerciseInfo[]>(storage.keys.EXERCISES);
      if (exercises && exercises.length > 0) {
        return { success: true, data: exercises };
      }
      // Return default exercises
      return { success: true, data: defaultExercises };
    },

    async search(query: string): Promise<ApiResponse<ExerciseInfo[]>> {
      await randomDelay();
      const exercises = await storage.get<ExerciseInfo[]>(storage.keys.EXERCISES) || defaultExercises;
      const filtered = exercises.filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase())
      );
      return { success: true, data: filtered };
    },
  },
};

// Default Exercise Database
const defaultExercises: ExerciseInfo[] = [
  // Chest
  { id: '1', name: 'Bench Press', category: 'chest', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'], isCompound: true },
  { id: '2', name: 'Incline Dumbbell Press', category: 'chest', muscleGroups: ['upper chest', 'shoulders', 'triceps'], equipment: ['dumbbells', 'bench'], isCompound: true },
  { id: '3', name: 'Dumbbell Fly', category: 'chest', muscleGroups: ['chest'], equipment: ['dumbbells', 'bench'], isCompound: false },
  { id: '4', name: 'Push Ups', category: 'chest', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: [], isCompound: true },
  { id: '5', name: 'Cable Crossover', category: 'chest', muscleGroups: ['chest'], equipment: ['cable machine'], isCompound: false },
  
  // Back
  { id: '6', name: 'Deadlift', category: 'back', muscleGroups: ['lower back', 'glutes', 'hamstrings'], equipment: ['barbell'], isCompound: true },
  { id: '7', name: 'Barbell Row', category: 'back', muscleGroups: ['lats', 'rhomboids', 'biceps'], equipment: ['barbell'], isCompound: true },
  { id: '8', name: 'Pull Ups', category: 'back', muscleGroups: ['lats', 'biceps'], equipment: ['pull-up bar'], isCompound: true },
  { id: '9', name: 'Lat Pulldown', category: 'back', muscleGroups: ['lats', 'biceps'], equipment: ['cable machine'], isCompound: true },
  { id: '10', name: 'Seated Cable Row', category: 'back', muscleGroups: ['lats', 'rhomboids', 'biceps'], equipment: ['cable machine'], isCompound: true },
  
  // Shoulders
  { id: '11', name: 'Overhead Press', category: 'shoulders', muscleGroups: ['shoulders', 'triceps'], equipment: ['barbell'], isCompound: true },
  { id: '12', name: 'Lateral Raise', category: 'shoulders', muscleGroups: ['side deltoids'], equipment: ['dumbbells'], isCompound: false },
  { id: '13', name: 'Face Pull', category: 'shoulders', muscleGroups: ['rear deltoids', 'traps'], equipment: ['cable machine'], isCompound: false },
  { id: '14', name: 'Arnold Press', category: 'shoulders', muscleGroups: ['shoulders'], equipment: ['dumbbells'], isCompound: true },
  
  // Arms
  { id: '15', name: 'Barbell Curl', category: 'arms', muscleGroups: ['biceps'], equipment: ['barbell'], isCompound: false },
  { id: '16', name: 'Tricep Pushdown', category: 'arms', muscleGroups: ['triceps'], equipment: ['cable machine'], isCompound: false },
  { id: '17', name: 'Hammer Curl', category: 'arms', muscleGroups: ['biceps', 'forearms'], equipment: ['dumbbells'], isCompound: false },
  { id: '18', name: 'Skull Crushers', category: 'arms', muscleGroups: ['triceps'], equipment: ['ez bar', 'bench'], isCompound: false },
  
  // Legs
  { id: '19', name: 'Squat', category: 'legs', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell', 'squat rack'], isCompound: true },
  { id: '20', name: 'Leg Press', category: 'legs', muscleGroups: ['quads', 'glutes'], equipment: ['leg press machine'], isCompound: true },
  { id: '21', name: 'Romanian Deadlift', category: 'legs', muscleGroups: ['hamstrings', 'glutes'], equipment: ['barbell'], isCompound: true },
  { id: '22', name: 'Leg Extension', category: 'legs', muscleGroups: ['quads'], equipment: ['leg extension machine'], isCompound: false },
  { id: '23', name: 'Leg Curl', category: 'legs', muscleGroups: ['hamstrings'], equipment: ['leg curl machine'], isCompound: false },
  { id: '24', name: 'Calf Raise', category: 'legs', muscleGroups: ['calves'], equipment: ['calf raise machine'], isCompound: false },
  { id: '25', name: 'Lunges', category: 'legs', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbells'], isCompound: true },
  
  // Core
  { id: '26', name: 'Plank', category: 'core', muscleGroups: ['abs', 'obliques'], equipment: [], isCompound: false },
  { id: '27', name: 'Cable Crunch', category: 'core', muscleGroups: ['abs'], equipment: ['cable machine'], isCompound: false },
  { id: '28', name: 'Hanging Leg Raise', category: 'core', muscleGroups: ['lower abs'], equipment: ['pull-up bar'], isCompound: false },
  { id: '29', name: 'Russian Twist', category: 'core', muscleGroups: ['obliques'], equipment: [], isCompound: false },
];

export default localApi;
