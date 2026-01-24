
/**
 * Google Sign-In Button Component
 * Follows Google's official brand guidelines
 * https://developers.google.com/identity/branding-guidelines
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signInWithGoogle } from '../../../services/socialAuth';
import { useTheme } from '../../../contexts/ThemeContext';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string, email: string | null, name: string | null, profileImage: string | null) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

// Google's official brand colors
const GOOGLE_BLUE = '#4285F4';

// Official Google "G" Logo Component
const GoogleLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 48 48">
    {/* Blue */}
    <Path
      fill="#4285F4"
      d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
    />
    {/* Green */}
    <Path
      fill="#34A853"
      d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
    />
    {/* Yellow */}
    <Path
      fill="#FBBC05"
      d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
    />
    {/* Red */}
    <Path
      fill="#EA4335"
      d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
    />
  </Svg>
);

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();

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
      style={[
        styles.button,
        { 
          backgroundColor: '#FFFFFF',
          borderColor: isDark ? '#8E8E93' : '#DADCE0'
        },
        (disabled || loading) && styles.buttonDisabled
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      android_ripple={{ color: '#F5F5F5' }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={GOOGLE_BLUE} style={styles.loader} />
      ) : (
        <View style={styles.iconContainer}>
          <GoogleLogo />
        </View>
      )}
      <Text style={[styles.text, { color: '#3C4043' }]}>
        Continue with Google
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loader: {
    marginRight: 12,
  },
  iconContainer: {
    marginRight: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
});
