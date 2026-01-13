
/**
 * Google Sign-In Button Component
 * Provides a branded Google sign-in button that follows Google's design guidelines
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Image } from 'react-native';
import { signInWithGoogle } from '../../../services/socialAuth';

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
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const result = await signInWithGoogle();
      onSuccess(result.idToken, result.email, result.name, result.profileImage);
    } catch (error: any) {
      onError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" style={styles.icon} />
        ) : (
          <View style={styles.iconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
        )}
        <Text style={styles.text}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
});
