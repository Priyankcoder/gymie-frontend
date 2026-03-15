
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { photoSyncService } from '../services/photoSyncService';
import { setApiUnauthorizedHandler } from '../services/apiClient';
import { getStoredToken, getStoredUser, storeToken, storeUserData, clearStoredToken, clearStoredUser } from '../services/authStorage';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (idToken: string, email: string | null, name: string | null, profileImage: string | null) => Promise<void>;
  loginWithApple: (idToken: string, email: string | null, name: string | null) => Promise<void>;
  logout: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUnauthorized = async () => {
    console.log('🔐 Token expired or invalid - logging out');
    await clearStoredToken();
    await clearStoredUser();
    setToken(null);
    setUser(null);
    setError('Your session has expired. Please login again.');
  };

  // Check for existing auth on mount
  useEffect(() => {
    checkAuth();

    // Register unauthorized handler for photo sync service and apiClient
    photoSyncService.setUnauthorizedHandler(handleUnauthorized);
    setApiUnauthorizedHandler(handleUnauthorized);
  }, []);

  const checkAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        getStoredToken(),
        getStoredUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.auth.login(email, password);
      
      if (response.token && response.user) {
        await storeToken(response.token);
        await storeUserData(response.user);
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.auth.register(email, password, name);
      
      if (response.user) {
        // Only store token if it exists (will be empty for unverified users)
        if (response.token) {
          await storeToken(response.token);
          setToken(response.token);
        }
        await storeUserData(response.user);
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string, email: string | null, name: string | null, profileImage: string | null) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.auth.loginWithGoogle(idToken, email, name, profileImage);
      
      if (response.token && response.user) {
        await storeToken(response.token);
        await storeUserData(response.user);
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign-in failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (idToken: string, email: string | null, name: string | null) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.auth.loginWithApple(idToken, email, name);
      
      if (response.token && response.user) {
        await storeToken(response.token);
        await storeUserData(response.user);
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Apple sign-in failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await clearStoredToken();
      await clearStoredUser();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    handleUnauthorized,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
