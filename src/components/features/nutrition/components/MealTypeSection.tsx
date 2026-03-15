
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Meal } from '../../../../types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealTypeSectionProps {
  mealType: MealType;
  meals: Meal[];
  onAddMeal: () => void;
}

const getMealTypeIcon = (mealType: MealType): keyof typeof Ionicons.glyphMap => {
  switch (mealType) {
    case 'breakfast':
      return 'sunny';
    case 'lunch':
      return 'partly-sunny';
    case 'dinner':
      return 'moon';
    case 'snack':
      return 'cafe';
  }
};

export const MealTypeSection: React.FC<MealTypeSectionProps> = ({
  mealType,
  meals,
  onAddMeal,
}) => {
  const { colors } = useTheme();

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeInfo}>
          <Ionicons
            name={getMealTypeIcon(mealType)}
            size={20}
            color={colors.accentBlue}
          />
          <Text style={[styles.typeName, { color: colors.textPrimary }]}>
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          {meals.length > 0 && (
            <Text style={[styles.totalCalories, { color: colors.textSecondary }]}>
              {Math.round(totalCalories)} kcal
            </Text>
          )}
        </View>
        <Pressable
          onPress={onAddMeal}
          style={({ pressed }) => pressed && styles.addButtonPressed}
          hitSlop={8}
        >
          <Ionicons name="add-circle" size={28} color={colors.accentBlue} />
        </Pressable>
      </View>
      {meals.length > 0 ? (
        meals.map((meal) => (
          <View key={meal.id} style={[styles.mealItem, { borderTopColor: colors.border }]}>
            <View style={styles.mealInfo}>
              <Text style={[styles.mealName, { color: colors.textPrimary }]} numberOfLines={1}>
                {meal.name}
              </Text>
              <Text style={[styles.mealMacros, { color: colors.textSecondary }]}>
                P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · F {Math.round(meal.fat)}g
              </Text>
            </View>
            <Text style={[styles.mealCalories, { color: colors.accentBlue }]}>
              {Math.round(meal.calories)} kcal
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No meals added
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalCalories: {
    fontSize: 13,
    fontWeight: '500',
  },
  addButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mealInfo: {
    flex: 1,
    marginRight: 12,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '500',
  },
  mealMacros: {
    fontSize: 12,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
