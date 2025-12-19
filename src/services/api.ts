import { API_CONFIG } from "../config/api";
import { localApi } from "./localApi";
import * as realApi from "./realApi";
import { workoutPlanApi, scheduledWorkoutApi } from "./workoutPlanApi";

// Export the appropriate API based on USE_MOCK flag
export const api = {
  // Auth - mock mode doesn't have auth, so provide stub methods
  auth: API_CONFIG.USE_MOCK
    ? {
        register: async (email: string, password: string, name: string) => ({
          success: true,
          data: { token: "mock-token", user: { id: 1, email, name } },
        }),
        login: async (email: string, password: string) => ({
          success: true,
          data: {
            token: "mock-token",
            user: { id: 1, email, name: "Mock User" },
          },
        }),
        logout: async () => ({ success: true }),
        getCurrentUser: async () => ({
          success: true,
          data: { id: 1, email: "mock@example.com", name: "Mock User" },
        }),
      }
    : {
        register: realApi.authApi.register,
        login: realApi.authApi.login,
        logout: realApi.authApi.logout,
        getCurrentUser: realApi.authApi.getCurrentUser,
      },

  // User Preferences
  preferences: API_CONFIG.USE_MOCK
    ? localApi.preferences
    : {
        get: async () => ({ success: true, data: null }),
        update: async (updates: any) => ({ success: true, data: updates }),
      },

  // Workouts
  workouts: API_CONFIG.USE_MOCK
    ? localApi.workouts
    : {
        // Real API methods
        getWorkouts: realApi.workoutApi.getWorkouts,
        getWorkout: realApi.workoutApi.getWorkout,
        createWorkout: realApi.workoutApi.createWorkout,
        updateWorkout: realApi.workoutApi.updateWorkout,
        deleteWorkout: realApi.workoutApi.deleteWorkout,
        getWorkoutStats: realApi.workoutApi.getWorkoutStats,
        // Aliases for localApi compatibility
        getAll: realApi.workoutApi.getWorkouts,
        getById: realApi.workoutApi.getWorkout,
        getByDate: async (date: string) => realApi.workoutApi.getWorkouts({ date }),
        create: realApi.workoutApi.createWorkout,
        update: realApi.workoutApi.updateWorkout,
        delete: realApi.workoutApi.deleteWorkout,
      },

  // Nutrition
  nutrition: API_CONFIG.USE_MOCK
    ? {
        getNutritionDays: localApi.meals.getAll,
        getNutritionDay: async (id: string) =>
          localApi.meals.getAll().then((res) => ({
            success: true,
            data: res.data?.find((m: any) => m.id === id) || null,
          })),
        getNutritionByDate: localApi.meals.getByDate,
        createNutritionDay: localApi.meals.create,
        updateNutritionDay: localApi.meals.update,
        deleteNutritionDay: localApi.meals.delete,
        getNutritionStats: async () => ({
          success: true,
          data: {
            averageCalories: 2000,
            averageProtein: 150,
            averageCarbs: 200,
            averageFat: 60,
          },
        }),
      }
    : {
        getNutritionDays: realApi.nutritionApi.getNutritionDays,
        getNutritionDay: realApi.nutritionApi.getNutritionDay,
        getNutritionByDate: realApi.nutritionApi.getNutritionByDate,
        createNutritionDay: realApi.nutritionApi.createNutritionDay,
        updateNutritionDay: realApi.nutritionApi.updateNutritionDay,
        deleteNutritionDay: realApi.nutritionApi.deleteNutritionDay,
        getNutritionStats: realApi.nutritionApi.getNutritionStats,
      },

  // Meals - Using mock API until backend implements these endpoints
  // TODO: Implement meals API in backend
  meals: localApi.meals,

  // Progress
  progress: API_CONFIG.USE_MOCK
    ? {
        getProgressPhotos: localApi.photos.getAll,
        createProgressPhoto: localApi.photos.create,
        deleteProgressPhoto: localApi.photos.delete,
        getWeightEntries: localApi.weightLogs.getAll,
        createWeightEntry: localApi.weightLogs.create,
        deleteWeightEntry: localApi.weightLogs.delete,
        getWeightProgress: async () =>
          localApi.weightLogs.getAll().then((res) => ({
            success: true,
            data: res.data || [],
          })),
        getVolumeStats: localApi.progress.getVolumeStats,
      }
    : {
        getProgressPhotos: realApi.progressApi.getProgressPhotos,
        createProgressPhoto: realApi.progressApi.createProgressPhoto,
        deleteProgressPhoto: realApi.progressApi.deleteProgressPhoto,
        getWeightEntries: realApi.progressApi.getWeightEntries,
        createWeightEntry: realApi.progressApi.createWeightEntry,
        deleteWeightEntry: realApi.progressApi.deleteWeightEntry,
        getWeightProgress: realApi.progressApi.getWeightProgress,
        getVolumeStats: async () => ({
          success: true,
          data: { thisWeek: 0, lastWeek: 0, thisMonth: 0, allTime: 0 },
        }),
      },

  // Personal Records - Using mock API until backend implements these endpoints
  // TODO: Implement personal records API in backend
  prs: localApi.prs,

  // Gym Attendance - Using mock API until backend implements these endpoints
  // TODO: Implement attendance API in backend
  attendance: localApi.attendance,

  // Templates - Using mock API until backend implements these endpoints
  // TODO: Implement templates API in backend
  templates: localApi.templates,

  // Weight Logs - Note: Weight entries are available via progress.weightEntries in real API
  // Using mock for compatibility with existing code structure
  weightLogs: localApi.weightLogs,

  // Exercises - Using mock API until backend implements these endpoints
  // TODO: Implement exercises library API in backend
  exercises: localApi.exercises,

  // Workout Plans
  workoutPlans: API_CONFIG.USE_MOCK
    ? localApi.workoutPlans
    : workoutPlanApi,

  // Scheduled Workouts
  scheduledWorkouts: API_CONFIG.USE_MOCK
    ? localApi.scheduledWorkouts
    : scheduledWorkoutApi,

  // Progress Photos - Real API is available via progress.progressPhotos
  // Using mock for compatibility with existing code structure
  progressPhotos: localApi.photos,
  
  // Photos alias for backwards compatibility
  photos: localApi.photos,
};

// Log current API mode
console.log(`API Mode: ${API_CONFIG.USE_MOCK ? "MOCK" : "REAL"}`);
if (!API_CONFIG.USE_MOCK) {
  console.log(`API Base URL: ${API_CONFIG.BASE_URL}`);
}
