
/**
 * Custom Modal Component
 * A reusable modal for displaying messages across all platforms
 * with consistent design and behavior
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'destructive';

interface CustomModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose?: () => void;
  // Optional custom icon override
  customIcon?: keyof typeof Ionicons.glyphMap;
  customIconColor?: string;
}

const { width } = Dimensions.get('window');

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  primaryButtonText = 'OK',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  customIcon,
  customIconColor,
}) => {
  const { colors, isDark } = useTheme();

  const triggerPrimaryHaptic = () => {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
      case 'destructive':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10B981' };
      case 'error':
        return { name: 'close-circle', color: '#EF4444' };
      case 'warning':
        return { name: 'warning', color: '#F59E0B' };
      case 'destructive':
        return { name: 'alert-circle', color: '#EF4444' };
      case 'confirm':
        return { name: 'help-circle', color: colors.primary };
      case 'info':
      default:
        return { name: 'information-circle', color: '#3B82F6' };
    }
  };

  const defaultIcon = getIconConfig();
  const icon = {
    name: (customIcon || defaultIcon.name) as any,
    color: customIconColor || defaultIcon.color,
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose || onPrimaryPress}
      statusBarTranslucent
    >
      <View style={styles.centeredView}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose || onSecondaryPress || onPrimaryPress}
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
                { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' },
              ]}
            />
          )}
        </Pressable>

        <View style={styles.modalContainer}>
          <Pressable
            style={[
              styles.modalView,
              {
                backgroundColor: colors.cardBackground || (isDark ? '#1F2937' : '#FFFFFF'),
                borderColor: isDark ? colors.border : '#E5E7EB',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <View style={[styles.iconWrapper, { backgroundColor: `${icon.color}10` }]}>
              <Ionicons name={icon.name} size={48} color={icon.color} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {message}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonsRow}>
              {secondaryButtonText && onSecondaryPress && (
                <Pressable
                  style={[
                    styles.modalButton,
                    styles.secondaryButton,
                    { borderColor: colors.border, backgroundColor: isDark ? colors.border + '20' : colors.background }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSecondaryPress!();
                  }}
                  android_ripple={{ color: colors.border }}
                >
                  <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                    {secondaryButtonText}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.modalButton,
                  styles.primaryButton,
                  { backgroundColor: icon.color },
                  secondaryButtonText && { flex: 1 }
                ]}
                onPress={() => {
                  triggerPrimaryHaptic();
                  onPrimaryPress();
                }}
                android_ripple={{ color: '#FFFFFF40' }}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  {primaryButtonText}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalView: {
    width: width - 48,
    maxWidth: 380,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
});
