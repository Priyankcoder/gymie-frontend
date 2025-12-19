
import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import {
  WorkoutPlan,
  ScheduledWorkout,
  WorkoutPlanDay,
  PlanRecurrence,
  ApiResponse,
} from '../types';

export const workoutPlanApi = {
  // Workout Plans
  async getAll(): Promise<ApiResponse<WorkoutPlan[]>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.WORKOUT_PLANS.LIST);
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getById(id: string): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.WORKOUT_PLANS.GET(id));
      return { success: true, data: response.data.data || null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getActive(): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.WORKOUT_PLANS.ACTIVE);
      return { success: true, data: response.data.data || null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async create(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<WorkoutPlan>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.WORKOUT_PLANS.CREATE, plan);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async update(id: string, updates: Partial<WorkoutPlan>): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.WORKOUT_PLANS.UPDATE(id), updates);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      await apiClient.delete(API_ENDPOINTS.WORKOUT_PLANS.DELETE(id));
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async setActive(id: string): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.WORKOUT_PLANS.SET_ACTIVE(id));
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async clone(id: string, newName: string): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.WORKOUT_PLANS.CLONE(id), { name: newName });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async setRecurrence(id: string, recurrence: PlanRecurrence | undefined): Promise<ApiResponse<boolean>> {
    try {
      console.log('🔵 [workoutPlanApi] setRecurrence called with:', { id, recurrence });
      const url = API_ENDPOINTS.WORKOUT_PLANS.SET_RECURRENCE(id);
      console.log('🔵 [workoutPlanApi] Calling URL:', url);
      const response = await apiClient.put(url, { recurrence });
      console.log('🔵 [workoutPlanApi] setRecurrence response:', response.data);
      return { success: true, data: true };
    } catch (error: any) {
      console.error('🔴 [workoutPlanApi] setRecurrence error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateDay(planId: string, dayId: string, updates: Partial<WorkoutPlanDay>): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.WORKOUT_PLANS.UPDATE_DAY(planId, dayId), updates);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async addDay(planId: string, day: Omit<WorkoutPlanDay, 'id'>): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.WORKOUT_PLANS.ADD_DAY(planId), day);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async removeDay(planId: string, dayId: string): Promise<ApiResponse<WorkoutPlan | null>> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.WORKOUT_PLANS.REMOVE_DAY(planId, dayId));
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const scheduledWorkoutApi = {
  async getAll(): Promise<ApiResponse<ScheduledWorkout[]>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SCHEDULED_WORKOUTS.LIST);
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<ScheduledWorkout[]>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SCHEDULED_WORKOUTS.BY_DATE_RANGE, {
        params: { start_date: startDate, end_date: endDate },
      });
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getByDate(date: string): Promise<ApiResponse<ScheduledWorkout[]>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SCHEDULED_WORKOUTS.BY_DATE, {
        params: { date },
      });
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getTodaysWorkout(): Promise<ApiResponse<{ scheduled: ScheduledWorkout | null; plan: WorkoutPlan | null; day: WorkoutPlanDay | null }>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SCHEDULED_WORKOUTS.TODAY);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateStatus(id: string, status: ScheduledWorkout['status'], workoutId?: string): Promise<ApiResponse<ScheduledWorkout | null>> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.SCHEDULED_WORKOUTS.UPDATE_STATUS(id), {
        status,
        workout_id: workoutId,
      });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      await apiClient.delete(API_ENDPOINTS.SCHEDULED_WORKOUTS.DELETE(id));
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async generateFromRecurrence(planId: string, startDate: string, endDate: string): Promise<ApiResponse<ScheduledWorkout[]>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SCHEDULED_WORKOUTS.GENERATE, {
        plan_id: planId,
        start_date: startDate,
        end_date: endDate,
      });
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async clearPlanSchedule(planId: string): Promise<ApiResponse<boolean>> {
    try {
      await apiClient.delete(API_ENDPOINTS.SCHEDULED_WORKOUTS.CLEAR_PLAN(planId));
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
