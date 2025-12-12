
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, MetricRing, MacroBar, QuickActionCard, StatCard } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { HealthMetrics, Meal, Workout, UserPreferences } from '../../src/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefsRes, mealsRes, workoutsRes, metricsRes] = await Promise.all([
        localApi.preferences.get(),
        localApi.meals.getByDate(today),
        localApi.workouts.getByDate(today),
        localApi.metrics.syncFromDevice(),
      ]);

      if (prefsRes.data) setPreferences(prefsRes.data);
      if (mealsRes.data) setTodayMeals(mealsRes.data);
      if (workoutsRes.data) setTodayWorkouts(workoutsRes.data);
      if (metricsRes.data) setHealthMetrics(metricsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate nutrition totals
  const nutritionTotals = todayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieGoal = preferences?.calorieGoal || 2200;
  const proteinGoal = preferences?.proteinGoal || 150;
  const carbsGoal = preferences?.carbsGoal || 250;
  const fatGoal = preferences?.fatGoal || 70;
  const stepsGoal = preferences?.stepsGoal || 10000;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {greeting()} 👋
            </Text>
            <Text style={[styles.date, { color: colors.textPrimary }]}>
              {formatDate()}
            </Text>
          </View>
        </View>

        {/* Main Calories Ring Card */}
        <Card style={styles.caloriesCard}>
          <View style={styles.caloriesContent}>
            <MetricRing
              value={nutritionTotals.calories}
              maxValue={calorieGoal}
              size={140}
              strokeWidth={12}
              color={colors.caloriesRing}
              label="Calories"
              unit="kcal"
            />
            <View style={styles.caloriesDetails}>
              <Text style={[styles.caloriesTitle, { color: colors.textPrimary }]}>
                Daily Nutrition
              </Text>
              <Text style={[styles.caloriesSubtitle, { color: colors.textSecondary }]}>
                {calorieGoal - nutritionTotals.calories > 0
                  ? `${calorieGoal - nutritionTotals.calories} kcal remaining`
                  : 'Goal reached! 🎉'}
              </Text>
              <View style={styles.macrosContainer}>
                <MacroBar
                  label="Protein"
                  value={nutritionTotals.protein}
                  maxValue={proteinGoal}
                  color={colors.proteinColor}
                />
                <MacroBar
                  label="Carbs"
                  value={nutritionTotals.carbs}
                  maxValue={carbsGoal}
                  color={colors.carbsColor}
                />
                <MacroBar
                  label="Fat"
                  value={nutritionTotals.fat}
                  maxValue={fatGoal}
                  color={colors.fatColor}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Health Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            title="Steps"
            value={healthMetrics?.steps?.toLocaleString() || '0'}
            icon={<Ionicons name="footsteps" size={18} color={colors.stepsColor} />}
            color={colors.stepsColor}
            style={styles.statCard}
          />
          <StatCard
            title="Heart Rate"
            value={healthMetrics?.heartRate || '--'}
            unit="bpm"
            icon={<Ionicons name="heart" size={18} color={colors.heartRateColor} />}
            color={colors.heartRateColor}
            style={styles.statCard}
          />
        </View>

        {/* Steps Progress */}
        <Card style={styles.stepsCard}>
          <View style={styles.stepsHeader}>
            <View style={styles.stepsInfo}>
              <Ionicons name="footsteps" size={24} color={colors.stepsColor} />
              <Text style={[styles.stepsTitle, { color: colors.textPrimary }]}>
                Daily Steps
              </Text>
            </View>
            <Text style={[styles.stepsValue, { color: colors.textPrimary }]}>
              {healthMetrics?.steps?.toLocaleString() || '0'} / {stepsGoal.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.stepsTrack, { backgroundColor: colors.progressBackground }]}>
            <View
              style={[
                styles.stepsFill,
                {
                  width: `${Math.min(((healthMetrics?.steps || 0) / stepsGoal) * 100, 100)}%`,
                  backgroundColor: colors.stepsColor,
                },
              ]}
            />
          </View>
        </Card>

        {/* Today Workout Summary */}
        <Card style={styles.workoutSummaryCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {"Today's Workout"}
            </Text>
            <Text style={[styles.sectionAction, { color: colors.accentBlue }]}>
              View All
            </Text>
          </View>
          {todayWorkouts.length > 0 ? (
            todayWorkouts.map((workout, index) => (
              <View key={workout.id} style={styles.workoutItem}>
                <View style={[styles.workoutIcon, { backgroundColor: `${colors.accentBlue}15` }]}>
                  <Ionicons name="barbell" size={20} color={colors.accentBlue} />
                </View>
                <View style={styles.workoutDetails}>
                  <Text style={[styles.workoutName, { color: colors.textPrimary }]}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                    {workout.exercises.length} exercises • {workout.duration || 0} min
                  </Text>
                </View>
                {workout.completed && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyWorkout}>
              <Ionicons name="fitness-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No workout logged today
              </Text>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <Text style={[styles.quickActionsTitle, { color: colors.textPrimary }]}>
          Quick Actions
        </Text>
        <QuickActionCard
          title="Log Workout"
          subtitle="Start a new workout session"
          icon={<Ionicons name="add-circle" size={24} color={colors.accentBlue} />}
          onPress={() => router.push('/workout')}
          color={colors.accentBlue}
        />
        <QuickActionCard
          title="Upload Meal Photo"
          subtitle="AI-powered macro estimation"
          icon={<Ionicons name="camera" size={24} color={colors.success} />}
          onPress={() => router.push('/nutrition')}
          color={colors.success}
        />
        <QuickActionCard
          title="View PRs"
          subtitle="Check your personal records"
          icon={<Ionicons name="trophy" size={24} color={colors.warning} />}
          onPress={() => router.push('/workout')}
          color={colors.warning}
        />

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  caloriesCard: {
    marginBottom: 16,
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesDetails: {
    flex: 1,
    marginLeft: 20,
  },
  caloriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  caloriesSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  macrosContainer: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  stepsCard: {
    marginBottom: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepsValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  stepsTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepsFill: {
    height: '100%',
    borderRadius: 4,
  },
  workoutSummaryCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDetails: {
    flex: 1,
    marginLeft: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyWorkout: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
