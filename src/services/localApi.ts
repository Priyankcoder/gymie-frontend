
import { storage } from './localStorage';
import {
  Workout,
  WorkoutTemplate,
  TemplateExercise,
  PersonalRecord,
  Meal,
  MealEstimation,
  Recipe,
  HealthMetrics,
  ProgressPhoto,
  UserPreferences,
  ExerciseInfo,
  ApiResponse,
  GymAttendance,
  StreakData,
  WeightLog,
  ExerciseProgress,
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
      
      // Record gym attendance
      if (workout.completed) {
        await localApi.attendance.checkIn(workout.date, workout.duration);
      }
      
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
      if (templates && templates.length > 0) {
        return { success: true, data: templates };
      }
      return { success: true, data: defaultTemplates };
    },

    async getById(id: string): Promise<ApiResponse<WorkoutTemplate | null>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES) || defaultTemplates;
      const template = templates.find(t => t.id === id) || null;
      return { success: true, data: template };
    },

    async create(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<ApiResponse<WorkoutTemplate>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES) || [];
      const newTemplate: WorkoutTemplate = { 
        ...template, 
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      templates.push(newTemplate);
      await storage.set(storage.keys.WORKOUT_TEMPLATES, templates);
      return { success: true, data: newTemplate };
    },

    async update(id: string, updates: Partial<WorkoutTemplate>): Promise<ApiResponse<WorkoutTemplate | null>> {
      await randomDelay();
      const templates = await storage.get<WorkoutTemplate[]>(storage.keys.WORKOUT_TEMPLATES) || [];
      const index = templates.findIndex(t => t.id === id);
      if (index === -1) {
        return { success: false, error: 'Template not found' };
      }
      templates[index] = { ...templates[index], ...updates };
      await storage.set(storage.keys.WORKOUT_TEMPLATES, templates);
      return { success: true, data: templates[index] };
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
              unit: 'kg',
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

  // ==================== Gym Attendance & Streak ====================
  attendance: {
    async getAll(): Promise<ApiResponse<GymAttendance[]>> {
      await randomDelay();
      const attendance = await storage.get<GymAttendance[]>(storage.keys.GYM_ATTENDANCE);
      return { success: true, data: attendance || [] };
    },

    async checkIn(date: string, duration?: number): Promise<ApiResponse<GymAttendance>> {
      await randomDelay();
      const attendance = await storage.get<GymAttendance[]>(storage.keys.GYM_ATTENDANCE) || [];
      
      // Check if already checked in today
      const existing = attendance.find(a => a.date === date);
      if (existing) {
        return { success: true, data: existing };
      }

      const newAttendance: GymAttendance = {
        id: generateId(),
        date,
        checkedIn: true,
        duration,
      };
      attendance.push(newAttendance);
      await storage.set(storage.keys.GYM_ATTENDANCE, attendance);
      return { success: true, data: newAttendance };
    },

    async getStreak(): Promise<ApiResponse<StreakData>> {
      await randomDelay();
      const attendance = await storage.get<GymAttendance[]>(storage.keys.GYM_ATTENDANCE) || [];
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      
      // Sort by date descending
      const sortedAttendance = [...attendance].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // For current streak, check consecutive days from today backwards
      const dateSet = new Set(sortedAttendance.map(a => a.date));
      let checkDate = new Date(today);
      
      // Check if worked out today or yesterday (allow 1 day gap)
      const todayStr = checkDate.toISOString().split('T')[0];
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      
      if (dateSet.has(todayStr) || dateSet.has(yesterdayStr)) {
        checkDate = dateSet.has(todayStr) ? new Date(today) : new Date(today);
        checkDate.setDate(checkDate.getDate() - (dateSet.has(todayStr) ? 0 : 1));
        
        while (dateSet.has(checkDate.toISOString().split('T')[0])) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // Calculate longest streak
      for (let i = 0; i < sortedAttendance.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedAttendance[i - 1].date);
          const currDate = new Date(sortedAttendance[i].date);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // This week workouts (Sunday to Saturday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const thisWeekWorkouts = attendance.filter(a => new Date(a.date) >= startOfWeek).length;

      // This month workouts
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthWorkouts = attendance.filter(a => new Date(a.date) >= startOfMonth).length;

      const streakData: StreakData = {
        currentStreak,
        longestStreak,
        totalWorkouts: workouts.filter(w => w.completed).length,
        thisWeekWorkouts,
        thisMonthWorkouts,
        lastWorkoutDate: sortedAttendance[0]?.date,
      };

      return { success: true, data: streakData };
    },
  },

  // ==================== Weight Logs ====================
  weightLogs: {
    async getAll(): Promise<ApiResponse<WeightLog[]>> {
      await randomDelay();
      const logs = await storage.get<WeightLog[]>(storage.keys.WEIGHT_LOGS);
      return { success: true, data: logs || [] };
    },

    async getLatest(): Promise<ApiResponse<WeightLog | null>> {
      await randomDelay();
      const logs = await storage.get<WeightLog[]>(storage.keys.WEIGHT_LOGS) || [];
      const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { success: true, data: sorted[0] || null };
    },

    async create(log: Omit<WeightLog, 'id'>): Promise<ApiResponse<WeightLog>> {
      await randomDelay();
      const logs = await storage.get<WeightLog[]>(storage.keys.WEIGHT_LOGS) || [];
      const newLog: WeightLog = { ...log, id: generateId() };
      logs.push(newLog);
      await storage.set(storage.keys.WEIGHT_LOGS, logs);
      
      // Update user preferences with current weight
      await localApi.preferences.update({ currentWeight: log.weight });
      
      return { success: true, data: newLog };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      await randomDelay();
      const logs = await storage.get<WeightLog[]>(storage.keys.WEIGHT_LOGS) || [];
      const filtered = logs.filter(l => l.id !== id);
      await storage.set(storage.keys.WEIGHT_LOGS, filtered);
      return { success: true, data: true };
    },
  },

  // ==================== Exercise Progress Analytics ====================
  progress: {
    async getExerciseProgress(exerciseName: string): Promise<ApiResponse<ExerciseProgress>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      
      const history: ExerciseProgress['history'] = [];
      
      for (const workout of workouts) {
        const exercise = workout.exercises.find(
          e => e.name.toLowerCase() === exerciseName.toLowerCase()
        );
        
        if (exercise && exercise.sets.some(s => s.completed)) {
          const completedSets = exercise.sets.filter(s => s.completed);
          const maxWeight = Math.max(...completedSets.map(s => s.weight));
          const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          const bestSet = completedSets.reduce((best, s) => 
            (s.weight > best.weight) ? { reps: s.reps, weight: s.weight } : best,
            { reps: 0, weight: 0 }
          );
          
          history.push({
            date: workout.date,
            maxWeight,
            totalVolume,
            bestSet,
          });
        }
      }

      // Sort by date
      history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        success: true,
        data: { exerciseName, history },
      };
    },

    async getAllExerciseNames(): Promise<ApiResponse<string[]>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      const exerciseNames = new Set<string>();
      
      for (const workout of workouts) {
        for (const exercise of workout.exercises) {
          exerciseNames.add(exercise.name);
        }
      }

      return { success: true, data: Array.from(exerciseNames).sort() };
    },

    async getVolumeStats(): Promise<ApiResponse<{
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      allTime: number;
    }>> {
      await randomDelay();
      const workouts = await storage.get<Workout[]>(storage.keys.WORKOUTS) || [];
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let thisWeek = 0;
      let lastWeek = 0;
      let thisMonth = 0;
      let allTime = 0;

      for (const workout of workouts) {
        const workoutDate = new Date(workout.date);
        const volume = workout.exercises.reduce((sum, ex) => 
          sum + ex.sets.filter(s => s.completed).reduce((setSum, s) => setSum + (s.weight * s.reps), 0),
          0
        );

        allTime += volume;
        
        if (workoutDate >= startOfWeek) {
          thisWeek += volume;
        } else if (workoutDate >= startOfLastWeek && workoutDate < startOfWeek) {
          lastWeek += volume;
        }
        
        if (workoutDate >= startOfMonth) {
          thisMonth += volume;
        }
      }

      return {
        success: true,
        data: { thisWeek, lastWeek, thisMonth, allTime },
      };
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

    async estimateFromImage(imageUri: string): Promise<ApiResponse<MealEstimation>> {
      await delay(800 + Math.random() * 700);
      
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
          suggestions: ['Grilled Chicken Breast', 'Steamed Rice', 'Mixed Vegetables'],
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

// Default Workout Templates
const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'template-push',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps',
    color: '#EF4444',
    createdAt: new Date().toISOString(),
    exercises: [
      { name: 'Bench Press', targetSets: 4, targetReps: 8 },
      { name: 'Overhead Press', targetSets: 3, targetReps: 10 },
      { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: 10 },
      { name: 'Lateral Raise', targetSets: 3, targetReps: 15 },
      { name: 'Tricep Pushdown', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: 'template-pull',
    name: 'Pull Day',
    description: 'Back and biceps',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    exercises: [
      { name: 'Deadlift', targetSets: 4, targetReps: 5 },
      { name: 'Barbell Row', targetSets: 4, targetReps: 8 },
      { name: 'Pull Ups', targetSets: 3, targetReps: 10 },
      { name: 'Face Pull', targetSets: 3, targetReps: 15 },
      { name: 'Barbell Curl', targetSets: 3, targetReps: 10 },
    ],
  },
  {
    id: 'template-legs',
    name: 'Leg Day',
    description: 'Quads, hamstrings, and calves',
    color: '#10B981',
    createdAt: new Date().toISOString(),
    exercises: [
      { name: 'Squat', targetSets: 4, targetReps: 8 },
      { name: 'Romanian Deadlift', targetSets: 3, targetReps: 10 },
      { name: 'Leg Press', targetSets: 3, targetReps: 12 },
      { name: 'Leg Curl', targetSets: 3, targetReps: 12 },
      { name: 'Calf Raise', targetSets: 4, targetReps: 15 },
    ],
  },
  {
    id: 'template-upper',
    name: 'Upper Body',
    description: 'Full upper body workout',
    color: '#8B5CF6',
    createdAt: new Date().toISOString(),
    exercises: [
      { name: 'Bench Press', targetSets: 4, targetReps: 8 },
      { name: 'Barbell Row', targetSets: 4, targetReps: 8 },
      { name: 'Overhead Press', targetSets: 3, targetReps: 10 },
      { name: 'Pull Ups', targetSets: 3, targetReps: 10 },
      { name: 'Dumbbell Fly', targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: 'template-fullbody',
    name: 'Full Body',
    description: 'Complete full body session',
    color: '#F59E0B',
    createdAt: new Date().toISOString(),
    exercises: [
      { name: 'Squat', targetSets: 3, targetReps: 8 },
      { name: 'Bench Press', targetSets: 3, targetReps: 8 },
      { name: 'Barbell Row', targetSets: 3, targetReps: 8 },
      { name: 'Overhead Press', targetSets: 3, targetReps: 10 },
      { name: 'Romanian Deadlift', targetSets: 3, targetReps: 10 },
    ],
  },
];

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
