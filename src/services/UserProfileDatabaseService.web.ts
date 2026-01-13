
/**
 * User Profile Database Service - Web Implementation
 * 
 * AsyncStorage-based local user profile storage for web platform.
 * Stores user profile information including display name and profile picture.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  created_at: number;
  updated_at: number;
}

class UserProfileDatabaseService {
  private initialized = false;
  private readonly STORAGE_KEY = 'gymie_user_profile';

  /**
   * Initialize storage (no-op for web, but kept for API compatibility)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[UserProfileDB] Already initialized');
      return;
    }

    this.initialized = true;
    console.log('[UserProfileDB] Web storage initialized successfully');
  }

  /**
   * Save user profile
   */
  async saveProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    try {
      const now = Date.now();
      const existingProfile = await this.getProfile(profile.user_id);
      
      const fullProfile: UserProfile = {
        id: existingProfile?.id || 1,
        ...profile,
        created_at: existingProfile?.created_at || now,
        updated_at: now,
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${profile.user_id}`,
        JSON.stringify(fullProfile)
      );

      console.log('[UserProfileDB] Profile saved successfully');
      return fullProfile;
    } catch (error) {
      console.error('[UserProfileDB] Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user_id
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as UserProfile;
    } catch (error) {
      console.error('[UserProfileDB] Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Update profile fields
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'display_name' | 'profile_picture' | 'bio'>>
  ): Promise<UserProfile | null> {
    try {
      const existingProfile = await this.getProfile(userId);
      
      if (!existingProfile) {
        console.warn('[UserProfileDB] Profile not found for update');
        return null;
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        updated_at: Date.now(),
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(updatedProfile)
      );

      console.log('[UserProfileDB] Profile updated successfully');
      return updatedProfile;
    } catch (error) {
      console.error('[UserProfileDB] Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
      console.log('[UserProfileDB] Profile deleted successfully');
      return true;
    } catch (error) {
      console.error('[UserProfileDB] Failed to delete profile:', error);
      return false;
    }
  }

  /**
   * Clear all data (for testing/logout)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profileKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY));
      await AsyncStorage.multiRemove(profileKeys);
      console.log('[UserProfileDB] All profiles cleared');
    } catch (error) {
      console.error('[UserProfileDB] Failed to clear all:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userProfileDB = new UserProfileDatabaseService();
