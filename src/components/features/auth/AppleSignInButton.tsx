
/**
 * Apple Sign-In Button Component
 * Provides a branded Apple sign-in button that follows Apple's design guidelines
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { signInWithApple, isAppleSignInAvailable } from '../../../services/socialAuth';

interface AppleSignInButtonProps {
  onSuccess: (idToken: string, email: string | null, name: string | null) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Apple Sign-In is only available on iOS 13+
    if (Platform.OS !== 'ios') return;
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const isAvailable = await isAppleSignInAvailable();
    setAvailable(isAvailable);
  };

  const handlePress = async () => {
    if (loading || disabled || !available) return;

    setLoading(true);
    try {
      const result = await signInWithApple();
      onSuccess(result.idToken, result.email, result.name);
    } catch (error: any) {
      onError(error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not available (e.g., on Android or iOS < 13)
  if (!available) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.icon} />
        ) : (
          <View style={styles.iconContainer}>
            <Text style={styles.appleIcon}></Text>
          </View>
        )}
        <Text style={styles.text}>Continue with Apple</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
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
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
