
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';

interface ExerciseStatsCardProps {
  maxWeight: number;
  max1RM: number;
  totalSessions: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export const ExerciseStatsCard: React.FC<ExerciseStatsCardProps> = ({
  maxWeight,
  max1RM,
  totalSessions,
  trend,
  unit,
}) => {
  const { colors } = useTheme();

  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  const getTrendColor = () => {
    if (trend === 'up') return colors.success;
    if (trend === 'down') return colors.error;
    return colors.textSecondary;
  };

  const getTrendText = () => {
    if (trend === 'up') return '↑ Up';
    if (trend === 'down') return '↓ Down';
    return '— Stable';
  };

  return (
    <>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="trophy" size={16} color={colors.warning} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max Weight</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {maxWeight} {unit}
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="flash" size={16} color={colors.accentBlue} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Est. 1RM</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {max1RM} {unit}
          </Text>
        </Card>
      </View>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="repeat" size={16} color={colors.success} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {totalSessions}
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trend</Text>
          </View>
          <Text style={[styles.statValue, { color: getTrendColor() }]}>
            {getTrendText()}
          </Text>
        </Card>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
