
/**
 * Global context for app-wide data
 * Provides shared access to user preferences, workouts, meals, etc.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { localApi } from '../services/localApi';
import { UserPreferences } from '../types';

interface AppDataContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refetchPreferences: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await localApi.preferences.get();
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const response = await localApi.preferences.update(updates);
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const value: AppDataContextType = {
    preferences,
    loading,
    updatePreferences,
    refetchPreferences: loadPreferences,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
