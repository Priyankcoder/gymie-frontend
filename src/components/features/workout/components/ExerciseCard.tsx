
/**
 * ExerciseCard Component
 * Displays an exercise with all its sets in an active workout
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Exercise, WorkoutSet } from '../../../../types';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onCompleteSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseIndex,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onCompleteSet,
  onRemoveExercise,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
            {exercise.sets.filter((s) => s.completed).length} of {exercise.sets.length} sets
          </Text>
        </View>
        <Pressable
          onPress={() => onRemoveExercise(exercise.id)}
          style={styles.removeExerciseButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </Pressable>
      </View>

      <View style={styles.setsHeader}>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Set
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Weight
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Reps
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {exercise.sets.map((set, setIndex) => (
        <SetRow
          key={set.id}
          set={set}
          setIndex={setIndex}
          onUpdateSet={(setId, updates) => onUpdateSet(exercise.id, setId, updates)}
          onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
          onCompleteSet={(setId) => onCompleteSet(exercise.id, setId)}
          canRemove={exercise.sets.length > 1}
        />
      ))}

      <Pressable
        style={[styles.addSetButton, { borderColor: colors.border }]}
        onPress={() => onAddSet(exercise.id)}
      >
        <Ionicons name="add" size={20} color={colors.accentBlue} />
        <Text style={[styles.addSetText, { color: colors.accentBlue }]}>
          Add Set
        </Text>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  removeExerciseButton: {
    padding: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addSetText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
});
