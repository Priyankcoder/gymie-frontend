
/**
 * SetRow Component
 * Displays a single set with reps, weight inputs and completion toggle
 */

import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { WorkoutSet } from '../../../../types';

interface SetRowProps {
  set: WorkoutSet;
  setIndex: number;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (setId: string) => void;
  onCompleteSet: (setId: string) => void;
  canRemove: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  setIndex,
  onUpdateSet,
  onRemoveSet,
  onCompleteSet,
  canRemove,
}) => {
  const { colors, borderRadius } = useTheme();

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

      <Pressable
        onPress={() => onCompleteSet(set.id)}
        style={[
          styles.checkButton,
          {
            backgroundColor: set.completed
              ? colors.success
              : colors.inputBackground,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Ionicons
          name={set.completed ? 'checkmark' : 'checkmark-outline'}
          size={20}
          color={set.completed ? '#FFF' : colors.textSecondary}
        />
      </Pressable>

      {canRemove && (
        <Pressable
          onPress={() => onRemoveSet(set.id)}
          style={styles.removeButton}
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
    opacity: 0.6,
  },
  setX: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButton: {
    marginLeft: 8,
  },
});
