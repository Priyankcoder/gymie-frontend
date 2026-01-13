
/**
 * Google Sign-In Button Component - Web Implementation
 * Uses @react-oauth/google for web platform
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string, email: string | null, name: string | null, profileImage: string | null) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      // The credential is the JWT ID token
      // We'll decode it on the backend, so just pass it along
      onSuccess(credentialResponse.credential, null, null, null);
    } else {
      onError('No credential received from Google');
    }
  };

  const handleError = () => {
    onError('Failed to sign in with Google');
  };

  if (disabled) {
    return (
      <View style={styles.container}>
        <View style={styles.disabledButton}>
          <span style={styles.disabledText}>Continue with Google</span>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
});
