
/**
 * User Profile Database Service
 * 
 * SQLite-based local user profile storage for offline-first operation.
 * Stores user profile information including display name and profile picture.
 * 
 * Future: This can be extended to sync with backend API
 */

import * as SQLite from 'expo-sqlite';

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
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private readonly DB_NAME = 'gymie_user.db';
  private readonly DB_VERSION = '1.0.0';

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[UserProfileDB] Already initialized');
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      
      await this.createTables();
      await this.initializeMetadata();
      
      this.initialized = true;
      console.log('[UserProfileDB] Database initialized successfully');
    } catch (error) {
      console.error('[UserProfileDB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        profile_picture TEXT,
        bio TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profile_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_user_id ON user_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_email ON user_profiles(email);
    `);

    console.log('[UserProfileDB] Tables created');
  }

  /**
   * Initialize metadata
   */
  private async initializeMetadata(): Promise<void> {
    if (!this.db) return;

    const metadata = await this.db.getFirstAsync<{ key: string; value: string }>(
      'SELECT * FROM profile_metadata WHERE key = ?',
      ['db_version']
    );

    if (!metadata) {
      await this.db.runAsync(
        `INSERT INTO profile_metadata (key, value, updated_at)
         VALUES (?, ?, ?)`,
        ['db_version', this.DB_VERSION, Date.now()]
      );
    }
  }

  /**
   * Get user profile by user_id
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!this.db) await this.initialize();

    try {
      const profile = await this.db!.getFirstAsync<UserProfile>(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      return profile || null;
    } catch (error) {
      console.error('[UserProfileDB] Error getting profile:', error);
      return null;
    }
  }

  /**
   * Get user profile by email
   */
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    if (!this.db) await this.initialize();

    try {
      const profile = await this.db!.getFirstAsync<UserProfile>(
        'SELECT * FROM user_profiles WHERE email = ?',
        [email]
      );

      return profile || null;
    } catch (error) {
      console.error('[UserProfileDB] Error getting profile by email:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const existing = await this.getProfile(profile.user_id);
      const now = Date.now();

      if (existing) {
        // Update existing profile
        await this.db!.runAsync(
          `UPDATE user_profiles 
           SET email = ?, display_name = ?, profile_picture = ?, bio = ?, updated_at = ?
           WHERE user_id = ?`,
          [
            profile.email,
            profile.display_name,
            profile.profile_picture || null,
            profile.bio || null,
            now,
            profile.user_id,
          ]
        );
        console.log('[UserProfileDB] Profile updated for user:', profile.user_id);
      } else {
        // Insert new profile
        await this.db!.runAsync(
          `INSERT INTO user_profiles (user_id, email, display_name, profile_picture, bio, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            profile.user_id,
            profile.email,
            profile.display_name,
            profile.profile_picture || null,
            profile.bio || null,
            now,
            now,
          ]
        );
        console.log('[UserProfileDB] Profile created for user:', profile.user_id);
      }
    } catch (error) {
      console.error('[UserProfileDB] Error upserting profile:', error);
      throw error;
    }
  }

  /**
   * Update profile fields
   */
  async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'display_name' | 'profile_picture' | 'bio'>>): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.display_name !== undefined) {
        fields.push('display_name = ?');
        values.push(updates.display_name);
      }
      if (updates.profile_picture !== undefined) {
        fields.push('profile_picture = ?');
        values.push(updates.profile_picture);
      }
      if (updates.bio !== undefined) {
        fields.push('bio = ?');
        values.push(updates.bio);
      }

      if (fields.length === 0) {
        console.log('[UserProfileDB] No fields to update');
        return;
      }

      fields.push('updated_at = ?');
      values.push(Date.now());
      values.push(userId);

      await this.db!.runAsync(
        `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );

      console.log('[UserProfileDB] Profile updated successfully');
    } catch (error) {
      console.error('[UserProfileDB] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.runAsync(
        'DELETE FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      console.log('[UserProfileDB] Profile deleted for user:', userId);
    } catch (error) {
      console.error('[UserProfileDB] Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get database version
   */
  async getVersion(): Promise<string> {
    return this.DB_VERSION;
  }

  /**
   * Clear all profile data (for testing/reset)
   */
  async clearAllProfiles(): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.runAsync('DELETE FROM user_profiles');
      console.log('[UserProfileDB] All profiles cleared');
    } catch (error) {
      console.error('[UserProfileDB] Error clearing profiles:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userProfileDatabase = new UserProfileDatabaseService();
export default userProfileDatabase;
