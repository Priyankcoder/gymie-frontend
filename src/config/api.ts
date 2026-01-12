
import { Platform } from 'react-native';

// Get the correct localhost address based on platform
const getDefaultBaseURL = () => {
  const envURL = process.env.EXPO_PUBLIC_API_URL;
  
  // If environment variable is set and doesn't use Android emulator address, use it
  if (envURL && !envURL.includes('10.0.2.2')) {
    return envURL;
  }
  
  // Platform-specific localhost addresses
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:8080/v1';
  }
  
  // iOS simulator and web can use localhost directly
  return 'http://localhost:8080/v1';
};

// API Configuration
export const API_CONFIG = {
  // Set to true to use mock data, false to use real API
  USE_MOCK: false,
  
  // API Base URL - automatically detects platform
  BASE_URL: getDefaultBaseURL(),
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DELETE_ACCOUNT: '/users/account',
  },
  
  // Workouts
  WORKOUTS: {
    LIST: '/workouts',
    CREATE: '/workouts',
    GET: (id: number) => `/workouts/${id}`,
    UPDATE: (id: number) => `/workouts/${id}`,
    DELETE: (id: number) => `/workouts/${id}`,
    STATS: '/workouts/stats',
  },
  
  // Nutrition
  NUTRITION: {
    LIST: '/nutrition',
    CREATE: '/nutrition',
    GET: (id: number) => `/nutrition/${id}`,
    UPDATE: (id: number) => `/nutrition/${id}`,
    DELETE: (id: number) => `/nutrition/${id}`,
    BY_DATE: '/nutrition/date',
    BY_RANGE: '/nutrition/range',
    STATS: '/nutrition/stats',
  },
  
  // Progress
  PROGRESS: {
    PHOTOS: {
      LIST: '/progress/photos',
      CREATE: '/progress/photos',
      UPDATE: (id: number) => `/progress/photos/${id}`,
      DELETE: (id: number) => `/progress/photos/${id}`,
    },
    WEIGHT: {
      LIST: '/progress/weight',
      CREATE: '/progress/weight',
      UPDATE: (id: number) => `/progress/weight/${id}`,
      DELETE: (id: number) => `/progress/weight/${id}`,
      STATS: '/progress/weight/stats',
    },
    UPLOAD_URL: '/progress/upload-url',
  },
  
  // Workout Plans
  WORKOUT_PLANS: {
    LIST: '/workout-plans',
    CREATE: '/workout-plans',
    GET: (id: string) => `/workout-plans/${id}`,
    UPDATE: (id: string) => `/workout-plans/${id}`,
    DELETE: (id: string) => `/workout-plans/${id}`,
    ACTIVE: '/workout-plans/active',
    SET_ACTIVE: (id: string) => `/workout-plans/${id}/active`,
    CLONE: (id: string) => `/workout-plans/${id}/clone`,
    SET_RECURRENCE: (id: string) => `/workout-plans/${id}/recurrence`,
    UPDATE_DAY: (planId: string, dayId: string) => `/workout-plans/${planId}/days/${dayId}`,
    ADD_DAY: (planId: string) => `/workout-plans/${planId}/days`,
    REMOVE_DAY: (planId: string, dayId: string) => `/workout-plans/${planId}/days/${dayId}`,
  },
  
  // Scheduled Workouts
  SCHEDULED_WORKOUTS: {
    LIST: '/scheduled-workouts',
    GET: (id: string) => `/scheduled-workouts/${id}`,
    TODAY: '/scheduled-workouts/today',
    BY_DATE: '/scheduled-workouts',
    BY_DATE_RANGE: '/scheduled-workouts',
    UPDATE_STATUS: (id: string) => `/scheduled-workouts/${id}/status`,
    DELETE: (id: string) => `/scheduled-workouts/${id}`,
    GENERATE: '/scheduled-workouts/generate',
    CLEAR_PLAN: (planId: string) => `/scheduled-workouts/plan/${planId}`,
  },
};
