
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '../../src/components/SafeAreaView';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyEmailScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing');
      return;
    }

    try {
      const response = await api.auth.verifyEmail(token);
      
      if (response.success && response.data) {
        setStatus('success');
        setVerifiedEmail(response.data.email);
        
        // Automatically redirect to login after 2 seconds
        setTimeout(() => {
          handleContinueToLogin();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(response.message || 'Verification failed');
      }
    } catch (err: any) {
      const message = err.message || 'An error occurred';
      
      if (message.toLowerCase().includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
        setErrorMessage(message);
      }
    }
  };

  const handleContinueToLogin = () => {
    // Try to redirect to app if possible, otherwise navigate within app
    router.replace('/(auth)/login');
  };

  const handleResendVerification = () => {
    router.replace({
      pathname: '/(auth)/verification-pending',
      params: { email: verifiedEmail }
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.accentBlue}15` }]}>
              <ActivityIndicator size="large" color={colors.accentBlue} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Verifying Your Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Please wait while we verify your email address...
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Email Verified! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your email has been successfully verified. Redirecting you to login...
            </Text>
            
            {verifiedEmail && (
              <View style={[styles.emailBox, { backgroundColor: colors.cardBackground }]}>
                <Ionicons name="mail" size={20} color={colors.success} />
                <Text style={[styles.emailText, { color: colors.textPrimary }]}>
                  {verifiedEmail}
                </Text>
              </View>
            )}

            <View style={[styles.infoBox, { backgroundColor: `${colors.accentBlue}10`, borderColor: colors.accentBlue }]}>
              <Ionicons name="information-circle" size={20} color={colors.accentBlue} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                You can close this tab and return to the Gymie app to log in.
              </Text>
            </View>
          </View>
        );

      case 'expired':
        return (
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="time-outline" size={64} color={colors.warning} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Link Expired
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              This verification link has expired. Please return to the Gymie app and request a new verification email.
            </Text>

            <View style={[styles.infoBox, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
              <Ionicons name="information-circle" size={20} color={colors.warning} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Close this tab and open the Gymie app to resend the verification email from the verification pending screen.
              </Text>
            </View>
          </View>
        );

      case 'error':
      default:
        return (
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="close-circle" size={64} color={colors.error} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Verification Failed
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {errorMessage || 'We couldn\'t verify your email. The link may be invalid or already used.'}
            </Text>

            <View style={[styles.infoBox, { backgroundColor: `${colors.error}10`, borderColor: colors.error }]}>
              <Ionicons name="information-circle" size={20} color={colors.error} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Close this tab and return to the Gymie app. If you're already verified, try logging in. Otherwise, request a new verification link.
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
