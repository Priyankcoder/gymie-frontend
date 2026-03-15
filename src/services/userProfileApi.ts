
import apiClient, { ApiResponse, handleApiError } from './apiClient';
import { API_ENDPOINTS, CLOUDINARY_CONFIG } from '../config/api';

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
 * Upload an image directly to Cloudinary and return the secure URL.
 * Handles both native file:// URIs and web blob: URIs.
 */
export const uploadToCloudinary = async (localUri: string): Promise<string> => {
  if (!CLOUDINARY_CONFIG.CLOUD_NAME || !CLOUDINARY_CONFIG.UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const formData = new FormData();

  if (localUri.startsWith('blob:') || localUri.startsWith('data:')) {
    // Web: fetch the blob URL and append the actual Blob object
    const blobResponse = await fetch(localUri);
    const blob = await blobResponse.blob();
    formData.append('file', blob, 'photo.jpg');
  } else {
    // Native: use the { uri, name, type } pattern supported by React Native's fetch
    const filename = localUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('file', { uri: localUri, name: filename, type } as unknown as Blob);
  }

  formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const data = await response.json();
  return data.secure_url as string;
};

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
