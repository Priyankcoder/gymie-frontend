
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, MetricRing } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';

interface NutritionSummaryCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
}

export const NutritionSummaryCard: React.FC<NutritionSummaryCardProps> = ({
  calories,
  protein,
  carbs,
  fat,
  calorieGoal,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <MetricRing
          value={calories}
          maxValue={calorieGoal}
          size={100}
          strokeWidth={10}
          color={colors.caloriesRing}
          unit="kcal"
        />
        <View style={styles.macros}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.proteinColor }]}>
              {protein}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.carbsColor }]}>
              {carbs}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.fatColor }]}>
              {fat}g
            </Text>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macros: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
