import apiClient, {
  ApiResponse,
  PaginatedResponse,
  handleApiError,
} from "./apiClient";
import { API_ENDPOINTS } from "../config/api";
import {
  User,
  Workout,
  NutritionDay,
  ProgressPhoto,
  WeightEntry,
} from "../types";
import { storeToken, storeUserData, clearStoredToken } from "./authStorage";

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    try {
      console.log('🚀 Register Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`,
        data: { email, name }
      });
      
      const response = await apiClient.post<
        ApiResponse<{ token: string; user: User }>
      >(API_ENDPOINTS.AUTH.REGISTER, { email, password, name });
      
      console.log('✅ Register Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        // Don't store token yet - user needs to verify email first
        // Token will be empty until email is verified
        if (response.data.data.token) {
          await storeToken(response.data.data.token);
          await storeUserData(response.data.data.user);
        }
        return response.data.data;
      }

      throw new Error(response.data.message || "Registration failed");
    } catch (error) {
      console.error('❌ Register Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  login: async (email: string, password: string) => {
    try {
      console.log('🚀 Login Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`,
        data: { email }
      });
      
      const response = await apiClient.post<
        ApiResponse<{ token: string; user: User }>
      >(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
      console.log('✅ Login Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        await storeToken(response.data.data.token);
        await storeUserData(response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.error('❌ Login Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  loginWithGoogle: async (idToken: string, email: string | null, name: string | null, profileImage: string | null) => {
    try {
      console.log('🚀 Google Login Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.GOOGLE}`,
        data: { email, name }
      });
      
      const response = await apiClient.post<
        ApiResponse<{ token: string; user: User }>
      >(API_ENDPOINTS.AUTH.GOOGLE, {
        id_token: idToken,
        email,
        name,
        profile_image: profileImage
      });
      
      console.log('✅ Google Login Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        await storeToken(response.data.data.token);
        await storeUserData(response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.message || "Google sign-in failed");
    } catch (error) {
      console.error('❌ Google Login Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  verifyEmail: async (token: string) => {
    try {
      console.log('🚀 Verify Email Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`,
        token
      });
      
      const response = await apiClient.get<
        ApiResponse<{ verified: boolean; email: string }>
      >(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`);
      
      console.log('✅ Verify Email Response:', response.status, response.data);

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || "Email verification failed");
    } catch (error) {
      console.error('❌ Verify Email Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  resendVerification: async (email: string) => {
    try {
      console.log('🚀 Resend Verification Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}`,
        email
      });
      
      const response = await apiClient.post<ApiResponse<{ email: string }>>(
        API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        { email }
      );
      
      console.log('✅ Resend Verification Response:', response.status, response.data);

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || "Failed to resend verification email");
    } catch (error) {
      console.error('❌ Resend Verification Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  getVerificationStatus: async (email: string) => {
    try {
      console.log('🚀 Get Verification Status Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.VERIFICATION_STATUS(email)}`,
        email
      });
      
      const response = await apiClient.get<
        ApiResponse<{ email: string; verified: boolean; cooldownRemaining?: number }>
      >(API_ENDPOINTS.AUTH.VERIFICATION_STATUS(email));
      
      console.log('✅ Get Verification Status Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to get verification status");
    } catch (error) {
      console.error('❌ Get Verification Status Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  loginWithApple: async (idToken: string, email: string | null, name: string | null) => {
    try {
      console.log('🚀 Apple Login Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.AUTH.APPLE}`,
        data: { email, name }
      });
      
      const response = await apiClient.post<
        ApiResponse<{ token: string; user: User }>
      >(API_ENDPOINTS.AUTH.APPLE, {
        id_token: idToken,
        email,
        name
      });
      
      console.log('✅ Apple Login Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        await storeToken(response.data.data.token);
        await storeUserData(response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.message || "Apple sign-in failed");
    } catch (error) {
      console.error('❌ Apple Login Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  logout: async () => {
    await clearStoredToken();
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        API_ENDPOINTS.USERS.PROFILE
      );

      if (response.data.success && response.data.data) {
        await storeUserData(response.data.data);
        return response.data.data;
      }

      throw new Error("Failed to get user data");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Workout API
export const workoutApi = {
  getWorkouts: async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<Workout>>(
        API_ENDPOINTS.WORKOUTS.LIST,
        { params: { page: 1, page_size: 100 } }
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      throw new Error("Failed to fetch workouts");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getWorkout: async (id: number) => {
    try {
      const response = await apiClient.get<ApiResponse<Workout>>(
        API_ENDPOINTS.WORKOUTS.GET(id)
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to fetch workout");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createWorkout: async (
    workout: Omit<Workout, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<Workout>>(
        API_ENDPOINTS.WORKOUTS.CREATE,
        workout
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to create workout");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  updateWorkout: async (id: number, workout: Partial<Workout>) => {
    try {
      const response = await apiClient.put<ApiResponse<Workout>>(
        API_ENDPOINTS.WORKOUTS.UPDATE(id),
        workout
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to update workout");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  deleteWorkout: async (id: number) => {
    try {
      await apiClient.delete(API_ENDPOINTS.WORKOUTS.DELETE(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getWorkoutStats: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.WORKOUTS.STATS
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return {
        totalWorkouts: 0,
        totalExercises: 0,
        totalSets: 0,
        totalVolume: 0,
        averageDuration: 0,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Nutrition API
export const nutritionApi = {
  getNutritionDays: async () => {
    try {
      const response = await apiClient.get<ApiResponse<NutritionDay[]>>(
        API_ENDPOINTS.NUTRITION.LIST
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      throw new Error("Failed to fetch nutrition days");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getNutritionDay: async (id: number) => {
    try {
      const response = await apiClient.get<ApiResponse<NutritionDay>>(
        API_ENDPOINTS.NUTRITION.GET(id)
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to fetch nutrition day");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getNutritionByDate: async (date: string) => {
    try {
      const response = await apiClient.get<ApiResponse<NutritionDay>>(
        API_ENDPOINTS.NUTRITION.BY_DATE,
        { params: { date } }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      // Return null if not found instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(handleApiError(error));
    }
  },

  createNutritionDay: async (
    nutritionDay: Omit<
      NutritionDay,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<NutritionDay>>(
        API_ENDPOINTS.NUTRITION.CREATE,
        nutritionDay
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to create nutrition day");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  updateNutritionDay: async (
    id: number,
    nutritionDay: Partial<NutritionDay>
  ) => {
    try {
      const response = await apiClient.put<ApiResponse<NutritionDay>>(
        API_ENDPOINTS.NUTRITION.UPDATE(id),
        nutritionDay
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to update nutrition day");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  deleteNutritionDay: async (id: number) => {
    try {
      await apiClient.delete(API_ENDPOINTS.NUTRITION.DELETE(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getNutritionStats: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.NUTRITION.STATS
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return {
        totalDays: 0,
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Progress API
export const progressApi = {
  getProgressPhotos: async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<ProgressPhoto>>(
        API_ENDPOINTS.PROGRESS.PHOTOS.LIST,
        { params: { page: 1, page_size: 100 } }
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      throw new Error("Failed to fetch progress photos");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createProgressPhoto: async (
    photo: Omit<ProgressPhoto, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<ProgressPhoto>>(
        API_ENDPOINTS.PROGRESS.PHOTOS.CREATE,
        photo
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to create progress photo");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  deleteProgressPhoto: async (id: number) => {
    try {
      await apiClient.delete(API_ENDPOINTS.PROGRESS.PHOTOS.DELETE(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getWeightEntries: async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<WeightEntry>>(
        API_ENDPOINTS.PROGRESS.WEIGHT.LIST,
        { params: { page: 1, page_size: 100 } }
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      throw new Error("Failed to fetch weight entries");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createWeightEntry: async (
    entry: Omit<WeightEntry, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await apiClient.post<ApiResponse<WeightEntry>>(
        API_ENDPOINTS.PROGRESS.WEIGHT.CREATE,
        entry
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Failed to create weight entry");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  deleteWeightEntry: async (id: number) => {
    try {
      await apiClient.delete(API_ENDPOINTS.PROGRESS.WEIGHT.DELETE(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getWeightProgress: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.PROGRESS.WEIGHT.STATS
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return {
        startWeight: null,
        currentWeight: null,
        goalWeight: null,
        totalChange: 0,
        averageChange: 0,
        entries: [],
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
