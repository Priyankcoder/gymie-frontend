
/**
 * SetRow Component
 * Displays a single set with reps, weight inputs and completion toggle
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../contexts/ThemeContext';
import { WorkoutSet } from '../../../../types';

interface SetRowProps {
  set: WorkoutSet;
  setIndex: number;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (setId: string) => void;
  onCompleteSet: (setId: string) => void;
  canRemove: boolean;
  isCelebrating?: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  setIndex,
  onUpdateSet,
  onRemoveSet,
  onCompleteSet,
  canRemove,
  isCelebrating = false,
}) => {
  const { colors, borderRadius } = useTheme();
  const checkScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;

  // Spring bounce when set is completed
  useEffect(() => {
    if (set.completed) {
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1.35,
          tension: 200,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      checkScale.setValue(1);
    }
  }, [set.completed]);

  return (
    <View style={styles.setRow}>
      <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
        {setIndex + 1}
      </Text>

      <TextInput
        style={[
          styles.setInput,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.textPrimary,
            borderRadius: borderRadius.md,
          },
          set.completed && styles.completedInput,
        ]}
        value={set.weight.toString()}
        onChangeText={(text) =>
          onUpdateSet(set.id, { weight: parseFloat(text) || 0 })
        }
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        editable={!set.completed}
      />

      <Text style={[styles.setX, { color: colors.textSecondary }]}>×</Text>

      <TextInput
        style={[
          styles.setInput,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.textPrimary,
            borderRadius: borderRadius.md,
          },
          set.completed && styles.completedInput,
        ]}
        value={set.reps.toString()}
        onChangeText={(text) =>
          onUpdateSet(set.id, { reps: parseInt(text) || 0 })
        }
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        editable={!set.completed}
      />

      <Animated.View style={{ transform: [{ scale: checkScale }], marginLeft: 8 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCompleteSet(set.id);
          }}
          style={({ pressed }) => [
            styles.checkButton,
            {
              backgroundColor: set.completed
                ? colors.success
                : colors.inputBackground,
              borderRadius: borderRadius.md,
            },
            isCelebrating && styles.celebrating,
            pressed && styles.checkPressed,
          ]}
        >
          <Ionicons
            name={set.completed ? 'checkmark' : 'checkmark-outline'}
            size={isCelebrating ? 24 : 20}
            color={set.completed ? '#FFF' : colors.textSecondary}
          />
          {isCelebrating && (
            <View style={styles.celebration}>
              <Text style={styles.celebrationText}>💪</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {canRemove && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onRemoveSet(set.id);
          }}
          style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  setInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  completedInput: {
    opacity: 0.5,
  },
  setX: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    width: 36,
    height: 36,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPressed: {
    opacity: 0.75,
  },
  removeButton: {
    marginLeft: 8,
  },
  celebrating: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  celebration: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    fontSize: 32,
  },
});
