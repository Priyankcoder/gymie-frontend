
import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';

type SettingType = 'toggle' | 'select' | 'navigation' | 'info';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | boolean;
  type: SettingType;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  hasBorder?: boolean;
  valueColor?: string;
  iconColor?: string;
  textColor?: string;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  value,
  type,
  onPress,
  onToggle,
  hasBorder = false,
  valueColor,
  iconColor,
  textColor,
}) => {
  const { colors } = useTheme();

  const renderValue = () => {
    if (type === 'toggle' && typeof value === 'boolean') {
      return (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.accentBlue }}
          thumbColor="#FFF"
        />
      );
    }

    if (type === 'select' || type === 'navigation') {
      return (
        <View style={styles.valueRow}>
          {value && (
            <Text style={[styles.value, { color: valueColor || colors.accentBlue }]}>
              {value}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      );
    }

    if (type === 'info') {
      return (
        <Text style={[styles.value, { color: valueColor || colors.textSecondary }]}>
          {value}
        </Text>
      );
    }

    return null;
  };

  const Component = type === 'toggle' || type === 'info' ? View : Pressable;
  const componentProps = type === 'toggle' || type === 'info' ? {} : { onPress };

  return (
    <Component
      style={[
        styles.container,
        hasBorder && { borderTopWidth: 1, borderTopColor: colors.border }
      ]}
      {...componentProps}
    >
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={20} color={iconColor || colors.textSecondary} />
        <Text style={[styles.label, { color: textColor || colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      {renderValue()}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
});
