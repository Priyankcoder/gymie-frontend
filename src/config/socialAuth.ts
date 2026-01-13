
/**
 * Social Authentication Configuration
 * Configuration for Google Sign-In and Apple Sign-In
 */

export const SOCIAL_AUTH_CONFIG = {
  google: {
    // Google OAuth credentials from Firebase Console
    webClientId: '817973187108-9an1jo238apofi7u1v0bh551m6afjbvr.apps.googleusercontent.com',
    iosClientId: '', // Optional - can be same as webClientId or leave empty
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  },
  apple: {
    // Apple Sign-In configuration (for iOS app only)
    // Service ID from Apple Developer Portal - will be configured later
    clientId: 'com.anonymous.Gymie.signin',
  },
};

// Helper to check if social auth is configured
export const isSocialAuthConfigured = () => {
  const hasGoogle = SOCIAL_AUTH_CONFIG.google.webClientId.length > 0;
  const hasApple = SOCIAL_AUTH_CONFIG.apple.clientId.length > 0;
  
  return {
    google: hasGoogle,
    apple: hasApple,
    any: hasGoogle || hasApple,
  };
};
