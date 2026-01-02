
import { useState, useEffect, useCallback } from 'react';
import { getStoredUserData } from '../services/authStorage';
import { userProfileDatabase, UserProfile as DBUserProfile } from '../services/UserProfileDatabaseService';
import { userProfileApi, UserProfileData } from '../services/userProfileApi';
import { API_CONFIG } from '../config/api';

const DEFAULT_USER_ID = 'local_user'; // Default user ID for local-only mode

export interface Profile {
  displayName?: string;
  email?: string;
  profilePicture?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook to manage user profile data
 * - In REAL mode: Syncs with backend API and caches locally in SQLite
 * - In MOCK mode: Uses only local SQLite database
 */
export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert backend profile to hook profile format
   */
  const fromBackendProfile = (backendProfile: UserProfileData): Profile => ({
    displayName: backendProfile.profile?.displayName || backendProfile.name,
    email: backendProfile.email,
    profilePicture: backendProfile.profile?.profilePicture,
    bio: backendProfile.profile?.bio,
    createdAt: backendProfile.createdAt,
    updatedAt: backendProfile.updatedAt,
  });

  /**
   * Convert database profile to hook profile format
   */
  const fromDBProfile = (dbProfile: DBUserProfile): Profile => ({
    displayName: dbProfile.display_name,
    email: dbProfile.email,
    profilePicture: dbProfile.profile_picture,
    bio: dbProfile.bio,
    createdAt: new Date(dbProfile.created_at).toISOString(),
    updatedAt: new Date(dbProfile.updated_at).toISOString(),
  });

  /**
   * Load profile from backend (REAL mode) or local database (MOCK mode)
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize database
      await userProfileDatabase.initialize();
      
      // Get auth user data
      const authUser = await getStoredUserData();
      const userEmail = authUser?.email || 'user@gymie.app';
      const userId = authUser?.id?.toString() || DEFAULT_USER_ID;

      if (!API_CONFIG.USE_MOCK) {
        // REAL MODE: Fetch from backend and cache locally
        try {
          const backendProfile = await userProfileApi.getProfile();
          
          // Update local cache
          await userProfileDatabase.upsertProfile({
            user_id: userId,
            email: backendProfile.email,
            display_name: backendProfile.profile?.displayName || backendProfile.name,
            profile_picture: backendProfile.profile?.profilePicture,
            bio: backendProfile.profile?.bio,
          });
          
          setProfile(fromBackendProfile(backendProfile));
        } catch (err) {
          console.error('Failed to fetch profile from backend, using cache:', err);
          
          // Fallback to local cache
          const dbProfile = await userProfileDatabase.getProfile(userId);
          if (dbProfile) {
            setProfile(fromDBProfile(dbProfile));
          } else {
            throw err;
          }
        }
      } else {
        // MOCK MODE: Use only local database
        let dbProfile = await userProfileDatabase.getProfile(userId);
        
        if (dbProfile) {
          // Update email if it changed
          if (dbProfile.email !== userEmail) {
            await userProfileDatabase.upsertProfile({
              user_id: userId,
              email: userEmail,
              display_name: dbProfile.display_name,
              profile_picture: dbProfile.profile_picture,
              bio: dbProfile.bio,
            });
            dbProfile = await userProfileDatabase.getProfile(userId);
          }
          
          if (dbProfile) {
            setProfile(fromDBProfile(dbProfile));
          }
        } else {
          // Create default profile
          const defaultDisplayName = authUser?.name || authUser?.displayName || 'Gymie User';
          
          await userProfileDatabase.upsertProfile({
            user_id: userId,
            email: userEmail,
            display_name: defaultDisplayName,
          });
          
          const newProfile = await userProfileDatabase.getProfile(userId);
          if (newProfile) {
            setProfile(fromDBProfile(newProfile));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
      // Set a fallback profile
      setProfile({
        email: 'user@gymie.app',
        displayName: 'Gymie User',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update profile with new data
   */
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      setError(null);
      
      if (!profile) {
        throw new Error('No profile loaded');
      }

      // Get user ID
      const authUser = await getStoredUserData();
      const userId = authUser?.id?.toString() || DEFAULT_USER_ID;
      
      // Prepare updates for database
      const dbUpdates: Partial<Pick<DBUserProfile, 'display_name' | 'profile_picture' | 'bio'>> = {};
      
      if (updates.displayName !== undefined) {
        dbUpdates.display_name = updates.displayName;
      }
      if (updates.profilePicture !== undefined) {
        dbUpdates.profile_picture = updates.profilePicture;
      }
      if (updates.bio !== undefined) {
        dbUpdates.bio = updates.bio;
      }

      if (!API_CONFIG.USE_MOCK) {
        // REAL MODE: Update backend first, then local cache
        await userProfileApi.updateProfile({
          displayName: updates.displayName,
          profilePicture: updates.profilePicture,
          bio: updates.bio,
        });
        
        // Update local cache
        await userProfileDatabase.updateProfile(userId, dbUpdates);
        
        // Refresh from backend to get latest data
        const updatedBackendProfile = await userProfileApi.getProfile();
        setProfile(fromBackendProfile(updatedBackendProfile));
      } else {
        // MOCK MODE: Update only local database
        await userProfileDatabase.updateProfile(userId, dbUpdates);
        
        // Refresh from database
        const updatedDbProfile = await userProfileDatabase.getProfile(userId);
        if (updatedDbProfile) {
          setProfile(fromDBProfile(updatedDbProfile));
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      throw err;
    }
  }, [profile]);

  /**
   * Refresh profile from source
   */
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
};
