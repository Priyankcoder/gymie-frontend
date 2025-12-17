
/**
 * ActiveWorkoutView Component
 * Displays the active workout interface with exercises and sets
 */

import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Workout, WorkoutSet } from '../../../../types';
import { ExerciseCard } from './ExerciseCard';

interface ActiveWorkoutViewProps {
  workout: Workout;
  onUpdateName: (name: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onCompleteSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onAddExercise: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  workout,
  onUpdateName,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onCompleteSet,
  onRemoveExercise,
  onAddExercise,
  onFinish,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Workout Header */}
      <View style={styles.header}>
        <TextInput
          style={[
            styles.nameInput,
            {
              color: colors.textPrimary,
              borderBottomColor: colors.border,
            },
          ]}
          value={workout.name}
          onChangeText={onUpdateName}
          placeholder="Workout Name"
          placeholderTextColor={colors.textSecondary}
        />
        <Pressable onPress={onCancel}>
          <Ionicons name="close-circle" size={28} color={colors.error} />
        </Pressable>
      </View>

      {/* Exercise Cards */}
      {workout.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={0}
          onUpdateSet={onUpdateSet}
          onRemoveSet={onRemoveSet}
          onAddSet={onAddSet}
          onCompleteSet={onCompleteSet}
          onRemoveExercise={onRemoveExercise}
        />
      ))}

      {/* Add Exercise Button */}
      <Button
        title="Add Exercise"
        variant="outline"
        onPress={onAddExercise}
        style={{ marginVertical: 16 }}
      />

      {/* Finish Workout Button */}
      <Button
        title="Finish Workout"
        onPress={onFinish}
        style={{ marginBottom: 100 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    borderBottomWidth: 2,
    paddingBottom: 8,
    marginRight: 12,
  },
});
