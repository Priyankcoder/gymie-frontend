
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { StreakData } from '../../../../types';

interface ProfileStatsCardProps {
  streakData: StreakData | null;
}

export const ProfileStatsCard: React.FC<ProfileStatsCardProps> = ({ streakData }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.value, { color: colors.warning }]}>
            🔥 {streakData?.currentStreak || 0}
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Current Streak
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.item}>
          <Text style={[styles.value, { color: colors.accentBlue }]}>
            {streakData?.totalWorkouts || 0}
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Total Workouts
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.item}>
          <Text style={[styles.value, { color: colors.success }]}>
            {streakData?.thisMonthWorkouts || 0}
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            This Month
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
  },
});
