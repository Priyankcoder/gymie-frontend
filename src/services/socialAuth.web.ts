
/**
 * Social Authentication Service - Web Implementation
 * Uses @react-oauth/google for web platform
 */

export interface SocialAuthResult {
  idToken: string;
  email: string | null;
  name: string | null;
  profileImage: string | null;
  provider: 'google' | 'apple';
}

/**
 * Initialize Google Sign-In for web
 * Not needed on web - handled by GoogleOAuthProvider
 */
export const initializeGoogleSignIn = () => {
  console.log('✅ Google Sign-In (Web) initialized via GoogleOAuthProvider');
};

/**
 * Sign in with Google on web
 * Note: On web, this is handled by the GoogleLogin component
 * This function exists for compatibility but shouldn't be called directly
 */
export const signInWithGoogle = async (): Promise<SocialAuthResult> => {
  throw new Error('Use GoogleLogin component for web sign-in');
};

/**
 * Sign out from Google on web
 */
export const signOutFromGoogle = async (): Promise<void> => {
  // Web signout is handled by clearing tokens
  console.log('Google sign-out on web');
};

/**
 * Check if Apple Sign-In is available
 * Apple Sign-In is not available on web
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  return false;
};

/**
 * Sign in with Apple
 * Not available on web
 */
export const signInWithApple = async (): Promise<SocialAuthResult> => {
  throw new Error('Apple Sign-In not available on web');
};

/**
 * Get current Google Sign-In user
 */
export const getCurrentGoogleUser = async () => {
  return null;
};
