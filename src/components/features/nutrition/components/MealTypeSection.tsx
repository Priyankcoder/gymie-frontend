
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
        </View>
        <Pressable onPress={onAddMeal}>
          <Ionicons name="add-circle" size={24} color={colors.accentBlue} />
        </Pressable>
      </View>
      {meals.length > 0 ? (
        meals.map((meal) => (
          <View key={meal.id} style={styles.mealItem}>
            <View style={styles.mealInfo}>
              <Text style={[styles.mealName, { color: colors.textPrimary }]}>
                {meal.name}
              </Text>
              <Text style={[styles.mealMacros, { color: colors.textSecondary }]}>
                P: {Math.round(meal.protein * 100) / 100}g • C: {Math.round(meal.carbs * 100) / 100}g • F: {Math.round(meal.fat * 100) / 100}g • Fiber: {Math.round((meal.fiber || 0) * 100) / 100}g • Na: {Math.round((meal.sodium || 0) * 100) / 100}mg
              </Text>
            </View>
            <Text style={[styles.mealCalories, { color: colors.accentBlue }]}>
              {Math.round(meal.calories * 100) / 100} kcal
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
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  mealInfo: {
    flex: 1,
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
