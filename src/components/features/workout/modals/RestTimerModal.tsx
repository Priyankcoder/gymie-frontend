
/**
 * RestTimerModal Component
 * Displays countdown timer between sets
 */

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { formatTime } from '../../../../utils';

interface RestTimerModalProps {
  visible: boolean;
  timeLeft: number;
  onClose: () => void;
  onSkip: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible,
  timeLeft,
  onClose,
  onSkip,
}) => {
  const { colors, borderRadius } = useTheme();

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderRadius: borderRadius.lg },
          ]}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>

          <Ionicons name="time-outline" size={64} color={colors.accentBlue} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Rest Time
          </Text>

          <Text style={[styles.timer, { color: colors.accentBlue }]}>
            {formatRestTime(timeLeft)}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Take a break between sets
          </Text>

          <Pressable
            style={[
              styles.skipButton,
              { backgroundColor: colors.accentBlue, borderRadius: borderRadius.md },
            ]}
            onPress={onSkip}
          >
            <Text style={styles.skipText}>Skip Rest</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  timer: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
