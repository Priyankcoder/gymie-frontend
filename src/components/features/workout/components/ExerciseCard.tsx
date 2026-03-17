/**
 * ExerciseCard
 *
 * Displays an exercise with all its sets during an active workout.
 *
 * Microinteractions:
 *  - Animated green completion badge (scale + fade) when all sets are done
 *  - Success haptic when the last set is checked off
 *  - Haptic feedback on add set / remove exercise
 *  - Info icon to drill into ExerciseDetailModal
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Exercise, ExerciseInfo, WorkoutSet } from '../../../../types';
import { SetRow } from './SetRow';
import { ExerciseDetailModal } from '../modals/ExerciseDetailModal';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseInfo?: ExerciseInfo;
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onCompleteSet: (exerciseId: string, setId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  celebratingSetId?: string | null;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseInfo,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onCompleteSet,
  onRemoveExercise,
  celebratingSetId,
}) => {
  const { colors } = useTheme();
  const [detailVisible, setDetailVisible] = useState(false);

  // ── Completion animation ─────────────────────────────────────────────────

  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const allDone = totalSets > 0 && completedSets === totalSets;

  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const prevAllDone = useRef(false);

  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      // Animate badge in
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          speed: 14,
          bounciness: 14,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (!allDone && prevAllDone.current) {
      // Animate badge out
      Animated.parallel([
        Animated.timing(badgeScale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevAllDone.current = allDone;
  }, [allDone, badgeScale, badgeOpacity]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const primaryMuscles = exerciseInfo?.primaryMuscles;
  const muscleLabel = primaryMuscles?.length
    ? primaryMuscles
        .slice(0, 2)
        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
        .join(' · ')
    : null;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.exerciseName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
            {/* Completion badge */}
            <Animated.View
              style={[
                styles.completeBadge,
                { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            </Animated.View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {completedSets} of {totalSets} sets
            </Text>
            {muscleLabel && (
              <>
                <View
                  style={[styles.metaDot, { backgroundColor: colors.textSecondary }]}
                />
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {muscleLabel}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Info button */}
        {exerciseInfo && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDetailVisible(true);
            }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.accentBlue}
            />
          </Pressable>
        )}

        {/* Remove button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onRemoveExercise(exercise.id);
          }}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </Pressable>
      </View>

      {/* Sets header */}
      <View style={styles.setsHeader}>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Set
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Weight
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          {' '}
        </Text>
        <Text style={[styles.setsHeaderText, { color: colors.textSecondary }]}>
          Reps
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Sets */}
      {exercise.sets.map((set, setIndex) => (
        <SetRow
          key={set.id}
          set={set}
          setIndex={setIndex}
          onUpdateSet={(setId, updates) => onUpdateSet(exercise.id, setId, updates)}
          onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
          onCompleteSet={(setId) => onCompleteSet(exercise.id, setId)}
          canRemove={exercise.sets.length > 1}
          isCelebrating={celebratingSetId === set.id}
        />
      ))}

      {/* Add set */}
      <Pressable
        style={[styles.addSetBtn, { borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAddSet(exercise.id);
        }}
      >
        <Ionicons name="add" size={20} color={colors.accentBlue} />
        <Text style={[styles.addSetText, { color: colors.accentBlue }]}>
          Add Set
        </Text>
      </Pressable>

      {/* Detail modal */}
      <ExerciseDetailModal
        visible={detailVisible}
        exercise={exerciseInfo ?? null}
        onClose={() => setDetailVisible(false)}
      />
    </Card>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseName: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, flexShrink: 1 },
  completeBadge: { flexShrink: 0 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: { fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  iconBtn: { padding: 8 },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 4,
  },
  addSetText: { fontSize: 14, fontWeight: '600' },
});
