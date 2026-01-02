
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Recipe } from '../../../../types';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{recipe.name}</Text>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {recipe.prepTime + recipe.cookTime} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {recipe.servings} servings
          </Text>
        </View>
      </View>
      <View style={styles.macros}>
        <Text style={[styles.macroText, { color: colors.proteinColor }]}>
          P: {Math.round(recipe.protein * 100) / 100}g
        </Text>
        <Text style={[styles.macroText, { color: colors.carbsColor }]}>
          C: {Math.round(recipe.carbs * 100) / 100}g
        </Text>
        <Text style={[styles.macroText, { color: colors.fatColor }]}>
          F: {Math.round(recipe.fat * 100) / 100}g
        </Text>
        <Text style={[styles.macroText, { color: '#10B981' }]}>
          Fiber: {Math.round(recipe.fiber * 100) / 100}g
        </Text>
        <Text style={[styles.macroText, { color: '#F59E0B' }]}>
          Na: {Math.round(recipe.sodium * 100) / 100}mg
        </Text>
        <Text style={[styles.macroText, { color: colors.accentBlue }]}>
          {Math.round(recipe.calories * 100) / 100} kcal
        </Text>
      </View>
      <Text style={[styles.ingredients, { color: colors.textSecondary }]}>
        {recipe.ingredients.join(', ')}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  macros: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  macroText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ingredients: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
