
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, MacroBar, MetricRing, QuickActionCard } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';
import { useRefreshOnFocus } from '../../src/hooks';
import { formatDate, getGreeting, getTodayString } from '../../src/utils';
import {
  Meal,
  PersonalRecord,
  StreakData,
  UserPreferences,
  Workout,
} from '../../src/types';

export default function HomeScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([]);
  const [volumeStats, setVolumeStats] = useState<{
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    allTime: number;
  } | null>(null);
  const today = getTodayString();

  const loadData = useCallback(async () => {
    try {
      console.log('🏠 Home: Loading data...');
      const [
        prefsRes,
        mealsRes,
        todayWorkoutsRes,
        allWorkoutsRes,
        prsRes,
      ] = await Promise.all([
        api.preferences.get(),
        api.meals.getByDate(today),
        api.workouts.getByDate ? api.workouts.getByDate(today) : { success: true, data: [] },
        api.workouts.getAll(),
        api.prs.getAll(),
      ]);

      console.log('🏠 Home: Responses received');
      console.log('🏠 Prefs:', prefsRes);
      console.log('🏠 Meals:', mealsRes);
      console.log('🏠 Today Workouts:', todayWorkoutsRes);
      console.log('🏠 All Workouts:', allWorkoutsRes);
      console.log('🏠 PRs:', prsRes);

      // Handle preferences (object, not array)
      if (prefsRes && !Array.isArray(prefsRes)) {
        setPreferences(prefsRes.data || prefsRes);
      }

      // Handle meals
      if (Array.isArray(mealsRes)) {
        setTodayMeals(mealsRes);
      } else if (mealsRes?.data) {
        setTodayMeals(Array.isArray(mealsRes.data) ? mealsRes.data : []);
      }

      // Handle today's workouts
      if (Array.isArray(todayWorkoutsRes)) {
        setTodayWorkouts(todayWorkoutsRes);
      } else if (todayWorkoutsRes?.data) {
        setTodayWorkouts(Array.isArray(todayWorkoutsRes.data) ? todayWorkoutsRes.data : []);
      }

      // Get all workouts for calculations
      const allWorkouts: Workout[] = Array.isArray(allWorkoutsRes)
        ? allWorkoutsRes
        : (allWorkoutsRes?.data || []);

      console.log('🏠 Processing', allWorkouts.length, 'workouts for stats');

      // Calculate streak from workouts
      if (allWorkouts.length > 0) {
        const sortedWorkouts = [...allWorkouts].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate: Date | null = null;

        // Calculate current streak (consecutive days from today backwards)
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        
        for (const workout of sortedWorkouts) {
          const workoutDate = new Date(workout.date);
          workoutDate.setHours(0, 0, 0, 0);
          
          if (!lastDate) {
            // First workout
            const daysDiff = Math.floor((todayDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0) {
              currentStreak = 1;
              tempStreak = 1;
              lastDate = workoutDate;
            } else if (daysDiff === 1) {
              currentStreak = 1;
              tempStreak = 1;
              lastDate = workoutDate;
            }
          } else {
            const daysDiff = Math.floor((lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              currentStreak++;
              tempStreak++;
            } else if (daysDiff === 0) {
              // Same day, continue
              tempStreak++;
            } else {
              // Streak broken for current, but continue for longest
              if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
              }
              tempStreak = 1;
            }
            lastDate = workoutDate;
          }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calculate this week's workouts (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeekWorkouts = allWorkouts.filter(
          w => new Date(w.date) >= weekAgo
        ).length;

        setStreakData({
          currentStreak,
          longestStreak,
          thisWeekWorkouts,
          lastWorkoutDate: allWorkouts.length > 0 ? allWorkouts[0].date : today,
        });
        
        console.log('✅ Home: Calculated streak data:', {
          currentStreak,
          longestStreak,
          thisWeekWorkouts,
        });
      } else {
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          thisWeekWorkouts: 0,
          lastWorkoutDate: today,
        });
      }

      // Calculate volume stats from workouts
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - 7);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 14);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let thisWeekVolume = 0;
      let lastWeekVolume = 0;
      let thisMonthVolume = 0;
      let allTimeVolume = 0;

      allWorkouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        const volume = workout.exercises.reduce((sum, ex) =>
          sum + ex.sets.reduce((setSum, set) =>
            set.completed ? setSum + (set.weight * set.reps) : setSum, 0
          ), 0
        );

        allTimeVolume += volume;

        if (workoutDate >= thisWeekStart) {
          thisWeekVolume += volume;
        }
        if (workoutDate >= lastWeekStart && workoutDate < thisWeekStart) {
          lastWeekVolume += volume;
        }
        if (workoutDate >= thisMonthStart) {
          thisMonthVolume += volume;
        }
      });

      setVolumeStats({
        thisWeek: Math.round(thisWeekVolume),
        lastWeek: Math.round(lastWeekVolume),
        thisMonth: Math.round(thisMonthVolume),
        allTime: Math.round(allTimeVolume),
      });

      console.log('✅ Home: Calculated volume stats:', {
        thisWeek: thisWeekVolume,
        lastWeek: lastWeekVolume,
        thisMonth: thisMonthVolume,
        allTime: allTimeVolume,
      });

      // Handle PRs
      const prsData = Array.isArray(prsRes) ? prsRes : (prsRes?.data || []);
      if (prsData.length > 0) {
        // Get recent PRs (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recent = prsData.filter(pr => new Date(pr.date) >= weekAgo);
        setRecentPRs(recent.slice(0, 3));
        console.log('✅ Home: Set recent PRs:', recent.length);
      }

      console.log('✅ Home: Data loaded successfully');
    } catch (error) {
      console.error('❌ Home: Error loading data:', error);
    }
  }, [today]);

  // Automatically refetch when screen comes into focus
  useRefreshOnFocus(loadData);

  // Extra guarantee: refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const volumeChange = volumeStats 
    ? ((volumeStats.thisWeek - volumeStats.lastWeek) / Math.max(volumeStats.lastWeek, 1)) * 100
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()} 💪
            </Text>
            <Text style={[styles.date, { color: colors.textPrimary }]}>
              {formatDate()}
            </Text>
          </View>
        </View>

        {/* Streak & Stats Row */}
        <View style={styles.statsRow}>
          {/* Streak Card */}
          <Card style={[styles.streakCard, { flex: 1 }]}>
            <View style={styles.streakContent}>
              <View style={[styles.streakIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakValue, { color: colors.textPrimary }]}>
                  {streakData?.currentStreak || 0}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
            </View>
            <View style={styles.streakMeta}>
              <Text style={[styles.streakMetaText, { color: colors.textSecondary }]}>
                Best: {streakData?.longestStreak || 0} days
              </Text>
            </View>
          </Card>

          {/* This Week Workouts */}
          <Card style={[styles.weekCard, { flex: 1 }]}>
            <View style={styles.weekContent}>
              <View style={[styles.weekIcon, { backgroundColor: `${colors.accentBlue}20` }]}>
                <Ionicons name="calendar" size={20} color={colors.accentBlue} />
              </View>
              <View style={styles.weekInfo}>
                <Text style={[styles.weekValue, { color: colors.textPrimary }]}>
                  {streakData?.thisWeekWorkouts || 0}
                </Text>
                <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>
                  This Week
                </Text>
              </View>
            </View>
            <View style={styles.weekDots}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <View
                  key={day}
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: day < (streakData?.thisWeekWorkouts || 0)
                        ? colors.accentBlue
                        : colors.progressBackground,
                    },
                  ]}
                />
              ))}
            </View>
          </Card>
        </View>

        {/* Volume Stats Card */}
        <Card style={styles.volumeCard}>
          <View style={styles.volumeHeader}>
            <View style={styles.volumeTitle}>
              <Ionicons name="barbell" size={20} color={colors.accentBlue} />
              <View>
                <Text style={[styles.volumeTitleText, { color: colors.textPrimary }]}>
                  Weekly Volume
                </Text>
                <Text style={[styles.volumeExplainer, { color: colors.textSecondary }]}>
                  sets × reps × weight
                </Text>
              </View>
            </View>
            {volumeChange !== 0 && (
              <View style={[
                styles.volumeChange,
                { backgroundColor: volumeChange > 0 ? `${colors.success}20` : `${colors.error}20` }
              ]}>
                <Ionicons
                  name={volumeChange > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={volumeChange > 0 ? colors.success : colors.error}
                />
                <Text style={[
                  styles.volumeChangeText,
                  { color: volumeChange > 0 ? colors.success : colors.error }
                ]}>
                  {Math.abs(volumeChange).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.volumeValue, { color: colors.textPrimary }]}>
            {formatVolume(volumeStats?.thisWeek || 0)} kg
          </Text>
          <Text style={[styles.volumeHint, { color: colors.textSecondary }]}>
            💡 Higher volume = more muscle stimulus
          </Text>
          <View style={[styles.volumeDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.volumeSubtext, { color: colors.textSecondary }]}>
            All time: {formatVolume(volumeStats?.allTime || 0)} kg lifted
          </Text>
        </Card>

        {/* Recent PRs */}
        {recentPRs.length > 0 && (
          <Card style={styles.prsCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trophy" size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Recent PRs 🎉
                </Text>
              </View>
              <Pressable onPress={() => router.push({ pathname: '/(tabs)/workout', params: { tab: 'history' } })}>
                <Text style={[styles.sectionAction, { color: colors.accentBlue }]}>
                  View All
                </Text>
              </Pressable>
            </View>
            {recentPRs.map((pr) => (
              <View key={pr.id} style={styles.prItem}>
                <Text style={[styles.prExercise, { color: colors.textPrimary }]}>
                  {pr.exerciseName}
                </Text>
                <Text style={[styles.prValue, { color: colors.warning }]}>
                  {pr.value} {pr.unit} × {pr.reps}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Daily Nutrition Card */}
        <Card style={styles.caloriesCard}>
          <View style={styles.caloriesContent}>
            <MetricRing
              value={nutritionTotals.calories}
              maxValue={calorieGoal}
              size={120}
              strokeWidth={10}
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

        {/* Today's Workout Summary */}
        <Card style={styles.workoutSummaryCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {"Today's Workout"}
            </Text>
            <Pressable onPress={() => router.push({ pathname: '/(tabs)/workout', params: { tab: 'history' } })}>
              <Text style={[styles.sectionAction, { color: colors.accentBlue }]}>
                View All
              </Text>
            </Pressable>
          </View>
          {todayWorkouts.length > 0 ? (
            todayWorkouts.map((workout) => (
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
          title="Start Workout"
          subtitle="Choose a template or start fresh"
          icon={<Ionicons name="play-circle" size={24} color={colors.success} />}
          onPress={() => router.push('/workout')}
          color={colors.success}
        />
        <QuickActionCard
          title="Log Meal"
          subtitle="Track your nutrition"
          icon={<Ionicons name="restaurant" size={24} color={colors.carbsColor} />}
          onPress={() => router.push('/nutrition')}
          color={colors.carbsColor}
        />
        <QuickActionCard
          title="View Progress"
          subtitle="Check your lifting stats"
          icon={<Ionicons name="stats-chart" size={24} color={colors.accentBlue} />}
          onPress={() => router.push('/(tabs)/progress')}
          color={colors.accentBlue}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  streakCard: {
    padding: 14,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireEmoji: {
    fontSize: 22,
  },
  streakInfo: {
    marginLeft: 12,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  streakMeta: {
    marginTop: 8,
  },
  streakMetaText: {
    fontSize: 11,
  },
  weekCard: {
    padding: 14,
  },
  weekContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekInfo: {
    marginLeft: 12,
  },
  weekValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  weekDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  volumeCard: {
    marginBottom: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  volumeChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  volumeChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  volumeExplainer: {
    fontSize: 10,
    marginTop: 2,
  },
  volumeValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  volumeHint: {
    fontSize: 11,
    marginTop: 6,
  },
  volumeDivider: {
    height: 1,
    marginVertical: 10,
  },
  volumeSubtext: {
    fontSize: 12,
  },
  prsCard: {
    marginBottom: 12,
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  prExercise: {
    fontSize: 15,
    fontWeight: '500',
  },
  prValue: {
    fontSize: 15,
    fontWeight: '700',
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
    marginLeft: 16,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  caloriesSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  macrosContainer: {
    marginTop: 4,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightModalContent: {
    width: '85%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  weightInput: {
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
