
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  trend,
  trendValue,
  style,
}) => {
  const { colors, borderRadius, shadows } = useTheme();
  const accentColor = color || colors.accentBlue;

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          ...shadows.sm,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        {icon && (
          <View 
            style={[
              styles.iconContainer, 
              { backgroundColor: `${accentColor}15` }
            ]}
          >
            {icon}
          </View>
        )}
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            {unit}
          </Text>
        )}
      </View>
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  trendContainer: {
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StatCard;
