
/**
 * TodaysWorkoutCard Component
 * Displays today's scheduled workout from a plan
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { WorkoutPlan, WorkoutPlanDay, ScheduledWorkout } from '../../../../types';

interface TodaysWorkoutCardProps {
  scheduled: ScheduledWorkout;
  plan: WorkoutPlan;
  day: WorkoutPlanDay;
  onStart: () => void;
}

export const TodaysWorkoutCard: React.FC<TodaysWorkoutCardProps> = ({
  scheduled,
  plan,
  day,
  onStart,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color={colors.accentBlue} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Today's Workout
        </Text>
      </View>

      <Text style={[styles.workoutName, { color: colors.textPrimary }]}>
        {day.name}
      </Text>

      <Text style={[styles.planName, { color: colors.textSecondary }]}>
        {plan.name}
      </Text>

      <View style={styles.exercises}>
        {day.exercises.slice(0, 3).map((ex, i) => (
          <Text key={i} style={[styles.exercise, { color: colors.textSecondary }]}>
            • {ex.name} {ex.targetSets}×{ex.targetReps}
          </Text>
        ))}
        {day.exercises.length > 3 && (
          <Text style={[styles.more, { color: colors.textSecondary }]}>
            +{day.exercises.length - 3} more
          </Text>
        )}
      </View>

      <Button title="Start Workout" onPress={onStart} style={{ marginTop: 12 }} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    marginBottom: 12,
  },
  exercises: {
    gap: 4,
  },
  exercise: {
    fontSize: 14,
  },
  more: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
