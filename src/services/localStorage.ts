
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@gymie_user_preferences',
  WORKOUTS: '@gymie_workouts',
  WORKOUT_TEMPLATES: '@gymie_workout_templates',
  WORKOUT_PLANS: '@gymie_workout_plans',
  SCHEDULED_WORKOUTS: '@gymie_scheduled_workouts',
  PERSONAL_RECORDS: '@gymie_personal_records',
  MEALS: '@gymie_meals',
  RECIPES: '@gymie_recipes',
  HEALTH_METRICS: '@gymie_health_metrics',
  PROGRESS_PHOTOS: '@gymie_progress_photos',
  PHOTO_SYNC_QUEUE: '@gymie_photo_sync_queue',
  EXERCISES: '@gymie_exercises',
  EXERCISES_LAST_SYNC: '@gymie_exercises_last_sync',
  EXERCISES_VERSION: '@gymie_exercises_version',
  GYM_ATTENDANCE: '@gymie_gym_attendance',
  WEIGHT_LOGS: '@gymie_weight_logs',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Generic storage functions
export const storage = {
  async get<T>(key: StorageKey): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: StorageKey, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  },

  async remove(key: StorageKey): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  keys: STORAGE_KEYS,
};

export default storage;
