
/**
 * Social Authentication Service
 * Handles Google Sign-In and Apple Sign-In authentication
 */

import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SOCIAL_AUTH_CONFIG } from '../config/socialAuth';

export interface SocialAuthResult {
  idToken: string;
  email: string | null;
  name: string | null;
  profileImage: string | null;
  provider: 'google' | 'apple';
}

/**
 * Initialize Google Sign-In
 * Call this on app start
 */
export const initializeGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: SOCIAL_AUTH_CONFIG.google.webClientId,
      iosClientId: SOCIAL_AUTH_CONFIG.google.iosClientId,
      offlineAccess: SOCIAL_AUTH_CONFIG.google.offlineAccess,
      forceCodeForRefreshToken: SOCIAL_AUTH_CONFIG.google.forceCodeForRefreshToken,
    });
    console.log('✅ Google Sign-In configured for', Platform.OS);
  } catch (error) {
    console.error('❌ Failed to configure Google Sign-In:', error);
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<SocialAuthResult> => {
  try {
    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();

    // Sign in
    const userInfo = await GoogleSignin.signIn();
    
    // Get ID token for backend verification
    const tokens = await GoogleSignin.getTokens();

    return {
      idToken: tokens.idToken,
      email: userInfo.user.email,
      name: userInfo.user.name || null,
      profileImage: userInfo.user.photo || null,
      provider: 'google',
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    
    // Handle specific error codes
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    } else {
      throw new Error('Failed to sign in with Google');
    }
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
  }
};

/**
 * Check if Apple Sign-In is available
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('Error checking Apple Sign-In availability:', error);
    return false;
  }
};

/**
 * Sign in with Apple
 */
export const signInWithApple = async (): Promise<SocialAuthResult> => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Apple returns identityToken which is the JWT ID token
    if (!credential.identityToken) {
      throw new Error('No identity token received from Apple');
    }

    // Construct full name from Apple's response
    let fullName: string | null = null;
    if (credential.fullName) {
      const { givenName, familyName } = credential.fullName;
      if (givenName || familyName) {
        fullName = [givenName, familyName].filter(Boolean).join(' ');
      }
    }

    return {
      idToken: credential.identityToken,
      email: credential.email || null,
      name: fullName,
      profileImage: null, // Apple doesn't provide profile images
      provider: 'apple',
    };
  } catch (error: any) {
    console.error('Apple Sign-In Error:', error);
    
    if (error.code === 'ERR_CANCELED') {
      throw new Error('Sign in was cancelled');
    } else {
      throw new Error('Failed to sign in with Apple');
    }
  }
};

/**
 * Get current Google Sign-In status
 */
export const getCurrentGoogleUser = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      return await GoogleSignin.getCurrentUser();
    }
    return null;
  } catch (error) {
    console.error('Error getting current Google user:', error);
    return null;
  }
};
