
import React, { useState, useEffect } from 'react';
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
import { CustomModal } from '../../src/components/common/CustomModal';
import { useCustomModal } from '../../src/hooks/useCustomModal';
import { api } from '../../src/services/api';

export default function VerificationPendingScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const modal = useCustomModal();
  const params = useLocalSearchParams();
  const email = params.email as string;
  
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // Start with 60s cooldown by default

  // Start countdown timer immediately
  useEffect(() => {
    if (!email) return;
    
    // Simple 60-second countdown timer (frontend-only)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [email]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !email) return;

    setIsResending(true);
    try {
      await api.auth.resendVerification(email);
      
      modal.showSuccess(
        'Email Sent',
        'A new verification email has been sent to your inbox.',
        () => modal.hideModal()
      );
      
      // Start cooldown (60 seconds to match backend)
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      modal.showError(
        'Resend Failed',
        err.message || 'Failed to resend verification email. Please try again later.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
          <Ionicons name="mail-outline" size={64} color={colors.success} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Check Your Email
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We've sent a verification link to:
        </Text>

        {/* Email Display */}
        <View style={[styles.emailBox, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="mail" size={20} color={colors.accentBlue} />
          <Text style={[styles.emailText, { color: colors.textPrimary }]}>
            {email}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Click the link in the email to verify your account
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              The link will expire in 24 hours
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="folder-open-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Check your spam folder if you don't see it
            </Text>
          </View>
        </View>

        {/* Resend Button */}
        <Pressable
          style={[
            styles.resendButton,
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              opacity: resendCooldown > 0 || isResending ? 0.5 : 1
            },
          ]}
          onPress={handleResendEmail}
          disabled={resendCooldown > 0 || isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={colors.accentBlue} />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={colors.accentBlue} />
              <Text style={[styles.resendButtonText, { color: colors.accentBlue }]}>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Back to Login */}
        <Pressable
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Ionicons name="arrow-back" size={20} color={colors.accentBlue} />
          <Text style={[styles.backButtonText, { color: colors.accentBlue }]}>
            Back to Login
          </Text>
        </Pressable>
      </View>

      <CustomModal
        visible={modal.visible}
        type={modal.config.type}
        title={modal.config.title}
        message={modal.config.message}
        primaryButtonText={modal.config.primaryButtonText}
        secondaryButtonText={modal.config.secondaryButtonText}
        onPrimaryPress={() => {
          modal.config.onPrimaryPress?.();
          modal.hideModal();
        }}
        onSecondaryPress={modal.config.onSecondaryPress}
        onClose={modal.hideModal}
      />
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
    paddingTop: 60,
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
    marginBottom: 16,
    textAlign: 'center',
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
  instructionsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
