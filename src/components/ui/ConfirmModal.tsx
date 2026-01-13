
/**
 * ConfirmModal Component
 * A production-ready confirmation modal with polished design
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
  destructive = false,
  icon,
  iconColor,
}) => {
  const { colors, isDark } = useTheme();

  const finalConfirmColor = confirmColor || (destructive ? colors.error : colors.primary);
  
  // Default icon based on destructive prop
  const defaultIcon = destructive ? 'alert-circle' : 'help-circle';
  const finalIcon = icon || defaultIcon;
  const finalIconColor = iconColor || finalConfirmColor;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={30}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
              ]}
            />
          )}
        </Pressable>

        <View style={styles.container}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: Platform.OS === 'web'
                  ? (isDark ? '#1C1C1E' : '#FFFFFF')
                  : colors.cardBackground,
                shadowColor: '#000',
              },
            ]}
          >
            {/* Icon Header */}
            <View style={styles.iconHeader}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${finalIconColor}${isDark ? '20' : '15'}`,
                  },
                ]}
              >
                <Ionicons
                  name={finalIcon}
                  size={28}
                  color={finalIconColor}
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: colors.textPrimary },
                ]}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={[
                  styles.message,
                  { color: colors.textSecondary },
                ]}
              >
                {message}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={[
                styles.divider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            />

            {/* Buttons */}
            <View style={styles.buttons}>
              {/* Cancel Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: isDark
                      ? pressed ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)'
                      : pressed ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                onPress={onCancel}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {cancelText}
                </Text>
              </Pressable>

              {/* Confirm Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: finalConfirmColor,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={onConfirm}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
  },
  modal: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  iconHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButton: {
    // No shadow - clean look
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
