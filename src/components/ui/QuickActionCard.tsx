
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  color,
  style,
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const accentColor = color || colors.accentBlue;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          ...shadows.md,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View 
        style={[
          styles.iconContainer, 
          { 
            backgroundColor: `${accentColor}15`,
            borderRadius: borderRadius.md,
          }
        ]}
      >
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chevron} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    opacity: 0.4,
    marginLeft: 4,
  },
});

export default QuickActionCard;
