
import apiClient, { ApiResponse, handleApiError } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface UserProfileData {
  id: number;
  email: string;
  name: string;
  profile?: {
    id: number;
    userId: number;
    displayName?: string;
    profilePicture?: string;
    bio?: string;
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;
    goal?: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  goal?: string;
}

/**
 * User Profile API
 * Handles user profile data management with backend
 */
export const userProfileApi = {
  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<UserProfileData> => {
    try {
      console.log('🚀 Get Profile Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.USERS.PROFILE}`,
      });

      const response = await apiClient.get<ApiResponse<UserProfileData>>(
        API_ENDPOINTS.USERS.PROFILE
      );

      console.log('✅ Get Profile Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get profile');
    } catch (error) {
      console.error('❌ Get Profile Error:', error);
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: UpdateProfileRequest): Promise<UserProfileData> => {
    try {
      console.log('🚀 Update Profile Request:', {
        url: `${apiClient.defaults.baseURL}${API_ENDPOINTS.USERS.UPDATE_PROFILE}`,
        data: updates,
      });

      const response = await apiClient.put<ApiResponse<UserProfileData>>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        updates
      );

      console.log('✅ Update Profile Response:', response.status, response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to update profile');
    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      throw new Error(handleApiError(error));
    }
  },
};
