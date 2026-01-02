
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Card, MetricRing } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';

interface NutritionSummaryCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  calorieGoal: number;
}

export const NutritionSummaryCard: React.FC<NutritionSummaryCardProps> = ({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sodium,
  calorieGoal,
}) => {
  const { colors, isDark } = useTheme();

  // Default goals for macros (can be customized)
  const proteinGoal = 150;
  const carbsGoal = 250;
  const fatGoal = 70;
  const fiberGoal = 25;
  const sodiumGoal = 2300;

  return (
    <Card style={styles.card}>
      {/* Featured Calorie Ring with subtle gradient background */}
      <View style={styles.featuredSection}>
        <View style={styles.featuredRingContainer}>
          <View style={[styles.ringBackground, styles.featuredRingBg, styles.featuredSize]}>
            <MetricRing
              value={calories}
              maxValue={calorieGoal}
              size={140}
              strokeWidth={12}
              color={colors.caloriesRing}
              label="Calories"
              unit="kcal"
            />
          </View>
          <View style={[styles.iconBadgeFeatured, { backgroundColor: colors.caloriesRing }]}>
            <Ionicons name="flame" size={18} color="white" />
          </View>
        </View>
      </View>

      {/* First Row: Protein, Fiber, Carbs */}
      <View style={styles.macrosGrid}>
        <View style={styles.ringItem}>
          <View style={[styles.ringBackground, styles.proteinRingBg, styles.macroSize]}>
            <MetricRing
              value={protein}
              maxValue={proteinGoal}
              size={95}
              strokeWidth={9}
              color={colors.proteinColor}
              label="Protein"
              unit="g"
            />
          </View>
          <View style={[styles.iconBadge, { backgroundColor: colors.proteinColor }]}>
            <MaterialCommunityIcons name="arm-flex" size={14} color="white" />
          </View>
        </View>
        <View style={styles.ringItem}>
          <View style={[styles.ringBackground, styles.fiberRingBg, styles.macroSize]}>
            <MetricRing
              value={fiber}
              maxValue={fiberGoal}
              size={95}
              strokeWidth={9}
              color="#10B981"
              label="Fiber"
              unit="g"
            />
          </View>
          <View style={[styles.iconBadge, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="barley" size={14} color="white" />
          </View>
        </View>
        <View style={styles.ringItem}>
          <View style={[styles.ringBackground, styles.carbsRingBg, styles.macroSize]}>
            <MetricRing
              value={carbs}
              maxValue={carbsGoal}
              size={95}
              strokeWidth={9}
              color={colors.carbsColor}
              label="Carbs"
              unit="g"
            />
          </View>
          <View style={[styles.iconBadge, { backgroundColor: colors.carbsColor }]}>
            <MaterialCommunityIcons name="bread-slice" size={14} color="white" />
          </View>
        </View>
      </View>

      {/* Second Row: Fat, Sodium */}
      <View style={styles.microGrid}>
        <View style={styles.ringItem}>
          <View style={[styles.ringBackground, styles.fatRingBg, styles.macroSize]}>
            <MetricRing
              value={fat}
              maxValue={fatGoal}
              size={95}
              strokeWidth={9}
              color={colors.fatColor}
              label="Fat"
              unit="g"
            />
          </View>
          <View style={[styles.iconBadge, { backgroundColor: colors.fatColor }]}>
            <MaterialCommunityIcons name="water" size={14} color="white" />
          </View>
        </View>
        <View style={styles.ringItem}>
          <View style={[styles.ringBackground, styles.sodiumRingBg, styles.macroSize]}>
            <MetricRing
              value={sodium}
              maxValue={sodiumGoal}
              size={95}
              strokeWidth={9}
              color="#F59E0B"
              label="Sodium"
              unit="mg"
            />
          </View>
          <View style={[styles.iconBadge, { backgroundColor: '#F59E0B' }]}>
            <MaterialCommunityIcons name="shaker-outline" size={14} color="white" />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  featuredSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  microGrid: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  ringItem: {
    alignItems: 'center',
    flex: 1,
  },
  ringBackground: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredSize: {
    width: 160,
    height: 160,
  },
  macroSize: {
    width: 115,
    height: 115,
  },
  microSize: {
    width: 105,
    height: 105,
  },
  featuredRingBg: {
    backgroundColor: 'rgba(10, 116, 255, 0.05)', // Light blue for calories
  },
  proteinRingBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // Light green for protein
  },
  carbsRingBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)', // Light orange for carbs
  },
  fatRingBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)', // Light red for fat
  },
  fiberRingBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // Light emerald for fiber
  },
  sodiumRingBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)', // Light amber for sodium
  },
  featuredRingContainer: {
    position: 'relative',
  },
  iconBadgeFeatured: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  iconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  iconBadgeSmall: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
});
