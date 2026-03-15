
/**
 * ExercisePickerModal Component
 * Modal for selecting exercises from the exercise database
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ExerciseInfo } from '../../../../types';

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: ExerciseInfo[];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseInfo) => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  exercises,
  onClose,
  onSelectExercise,
}) => {
  const { colors, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (exercise: ExerciseInfo) => {
    onSelectExercise(exercise);
    setSearchQuery(''); // Reset search after selection
  };

  const handleClose = () => {
    setSearchQuery(''); // Reset search on close
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.overlay}
      >
        <View style={[styles.container, { backgroundColor: colors.card, paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Add Exercise
            </Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search Input */}
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderRadius: borderRadius.md,
              },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.exerciseCategory, { color: colors.textSecondary }]}>
                    {item.category}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.accentBlue} />
              </Pressable>
            )}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
});
