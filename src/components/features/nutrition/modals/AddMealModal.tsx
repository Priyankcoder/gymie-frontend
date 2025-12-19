
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';
import { Meal } from '../../../../types';
import { getTodayString } from '../../../../utils/date';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AddMealModalProps {
  visible: boolean;
  mealType: MealType;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  visible,
  mealType,
  onClose,
  onSuccess,
}) => {
  const { colors, borderRadius } = useTheme();
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const today = getTodayString();

  const resetForm = () => {
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
  };

  const handleSave = async () => {
    if (!mealName || !mealCalories) {
      Alert.alert('Required', 'Please enter meal name and calories');
      return;
    }

    try {
      const newMeal: Omit<Meal, 'id'> = {
        name: mealName,
        calories: parseInt(mealCalories) || 0,
        protein: parseInt(mealProtein) || 0,
        carbs: parseInt(mealCarbs) || 0,
        fat: parseInt(mealFat) || 0,
        mealType,
        date: today,
        timestamp: Date.now(),
      };

      await api.meals.create(newMeal);
      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Meal name"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.macroInputRow}>
              <TextInput
                style={[
                  styles.macroInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={mealCalories}
                onChangeText={setMealCalories}
                placeholder="Calories"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.macroInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={mealProtein}
                onChangeText={setMealProtein}
                placeholder="Protein (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInputRow}>
              <TextInput
                style={[
                  styles.macroInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={mealCarbs}
                onChangeText={setMealCarbs}
                placeholder="Carbs (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.macroInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={mealFat}
                onChangeText={setMealFat}
                placeholder="Fat (g)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <Button title="Add Meal" onPress={handleSave} style={{ marginTop: 16 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    padding: 16,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
});
