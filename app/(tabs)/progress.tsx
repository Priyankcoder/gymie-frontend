
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, LineChart } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { Workout, WeightLog, UserPreferences, ExerciseInfo } from '../../src/types';

type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type MetricType = 'weight' | 'reps' | 'volume' | '1rm';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface ExerciseStats {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  max1RM: number;
  totalSessions: number;
  lastPerformed: string | null;
  trend: 'up' | 'down' | 'stable';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgressScreen() {
  const { colors, spacing, borderRadius } = useTheme();

  const [selectedTab, setSelectedTab] = useState<'exercises' | 'weight'>('exercises');
  const [exerciseRange, setExerciseRange] = useState<DateRange>('3M');
  const [weightRange, setWeightRange] = useState<DateRange>('1M');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const dateRanges: DateRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];
  const metrics: { key: MetricType; label: string }[] = [
    { key: 'weight', label: 'Weight' },
    { key: 'reps', label: 'Reps' },
    { key: 'volume', label: 'Volume' },
    { key: '1rm', label: '1RM' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [workoutsRes, weightRes, exercisesRes, prefsRes] = await Promise.all([
      localApi.workouts.getAll(),
      localApi.weightLogs.getAll(),
      localApi.exercises.getAll(),
      localApi.preferences.get(),
    ]);

    if (workoutsRes.data) {
      setWorkouts(workoutsRes.data);
      // Auto-select first exercise if none selected
      if (!selectedExercise && workoutsRes.data.length > 0) {
        const exerciseMap = new Map<string, number>();
        workoutsRes.data.forEach(workout => {
          workout.exercises.forEach(ex => {
            exerciseMap.set(ex.name, (exerciseMap.get(ex.name) || 0) + 1);
          });
        });
        const sorted = Array.from(exerciseMap.entries()).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          setSelectedExercise(sorted[0][0]);
        }
      }
    }
    if (weightRes.data) {
      const sorted = [...weightRes.data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setWeightLogs(sorted);
    }
    if (exercisesRes.data) setExercises(exercisesRes.data);
    if (prefsRes.data) setPreferences(prefsRes.data);
  };

  // Get unique exercises from workout history
  const uniqueExercises = useMemo(() => {
    const exerciseMap = new Map<string, { name: string; count: number; lastDate: string }>();
    
    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        const existing = exerciseMap.get(ex.name);
        if (existing) {
          existing.count++;
          if (workout.date > existing.lastDate) {
            existing.lastDate = workout.date;
          }
        } else {
          exerciseMap.set(ex.name, { name: ex.name, count: 1, lastDate: workout.date });
        }
      });
    });

    return Array.from(exerciseMap.values())
      .sort((a, b) => b.count - a.count);
  }, [workouts]);

  // Filter exercises by search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return uniqueExercises;
    return uniqueExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueExercises, searchQuery]);

  // Calculate date filter
  const getDateFilter = (range: DateRange): Date => {
    const now = new Date();
    switch (range) {
      case '1W': return new Date(now.setDate(now.getDate() - 7));
      case '1M': return new Date(now.setMonth(now.getMonth() - 1));
      case '3M': return new Date(now.setMonth(now.getMonth() - 3));
      case '6M': return new Date(now.setMonth(now.getMonth() - 6));
      case '1Y': return new Date(now.setFullYear(now.getFullYear() - 1));
      case 'ALL': return new Date(0);
    }
  };

  // Calculate 1RM using Epley formula
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  // Get exercise chart data
  const getExerciseChartData = (): ChartDataPoint[] => {
    if (!selectedExercise) return [];
    
    const filterDate = getDateFilter(exerciseRange);
    const dataPoints: ChartDataPoint[] = [];

    const filteredWorkouts = workouts
      .filter(w => new Date(w.date) >= filterDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    filteredWorkouts.forEach(workout => {
      const exercise = workout.exercises.find(
        ex => ex.name.toLowerCase() === selectedExercise.toLowerCase()
      );

      if (exercise) {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        let value: number;
        switch (selectedMetric) {
          case 'weight':
            value = Math.max(...completedSets.map(s => s.weight));
            break;
          case 'reps':
            value = Math.max(...completedSets.map(s => s.reps));
            break;
          case 'volume':
            value = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
            break;
          case '1rm':
            value = Math.max(...completedSets.map(s => calculate1RM(s.weight, s.reps)));
            break;
        }

        dataPoints.push({ date: workout.date, value });
      }
    });

    return dataPoints;
  };

  // Get exercise stats
  const getExerciseStats = (): ExerciseStats | null => {
    if (!selectedExercise) return null;

    const filterDate = getDateFilter(exerciseRange);
    let maxWeight = 0;
    let maxReps = 0;
    let maxVolume = 0;
    let max1RM = 0;
    let totalSessions = 0;
    let lastPerformed: string | null = null;
    const values: number[] = [];

    workouts
      .filter(w => new Date(w.date) >= filterDate)
      .forEach(workout => {
        const exercise = workout.exercises.find(
          ex => ex.name.toLowerCase() === selectedExercise.toLowerCase()
        );

        if (exercise) {
          const completedSets = exercise.sets.filter(s => s.completed);
          if (completedSets.length === 0) return;

          totalSessions++;
          if (!lastPerformed || workout.date > lastPerformed) {
            lastPerformed = workout.date;
          }

          completedSets.forEach(set => {
            maxWeight = Math.max(maxWeight, set.weight);
            maxReps = Math.max(maxReps, set.reps);
            const volume = set.weight * set.reps;
            maxVolume = Math.max(maxVolume, volume);
            const oneRM = calculate1RM(set.weight, set.reps);
            max1RM = Math.max(max1RM, oneRM);
          });

          // Track max weight for trend
          values.push(Math.max(...completedSets.map(s => s.weight)));
        }
      });

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (values.length >= 3) {
      const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      if (recentAvg > olderAvg * 1.05) trend = 'up';
      else if (recentAvg < olderAvg * 0.95) trend = 'down';
    }

    return { maxWeight, maxReps, maxVolume, max1RM, totalSessions, lastPerformed, trend };
  };

  // Get body weight chart data
  const getWeightChartData = (): ChartDataPoint[] => {
    const filterDate = getDateFilter(weightRange);
    return weightLogs
      .filter(log => new Date(log.date) >= filterDate)
      .map(log => ({ date: log.date, value: log.weight }));
  };

  // Get body weight stats
  const getWeightStats = () => {
    const filterDate = getDateFilter(weightRange);
    const filtered = weightLogs.filter(log => new Date(log.date) >= filterDate);
    
    if (filtered.length === 0) return null;

    const weights = filtered.map(l => l.weight);
    const current = filtered[filtered.length - 1]?.weight || 0;
    const highest = Math.max(...weights);
    const lowest = Math.min(...weights);

    // Weekly average
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = filtered.filter(l => new Date(l.date) >= weekAgo);
    const weeklyAvg = weekLogs.length > 0 
      ? weekLogs.reduce((sum, l) => sum + l.weight, 0) / weekLogs.length 
      : current;

    // Monthly average
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthLogs = filtered.filter(l => new Date(l.date) >= monthAgo);
    const monthlyAvg = monthLogs.length > 0 
      ? monthLogs.reduce((sum, l) => sum + l.weight, 0) / monthLogs.length 
      : current;

    // Trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (filtered.length >= 3) {
      const recentAvg = filtered.slice(-3).reduce((a, b) => a + b.weight, 0) / 3;
      const olderAvg = filtered.slice(0, 3).reduce((a, b) => a + b.weight, 0) / 3;
      if (recentAvg > olderAvg * 1.01) trend = 'up';
      else if (recentAvg < olderAvg * 0.99) trend = 'down';
    }

    return { current, highest, lowest, weeklyAvg, monthlyAvg, trend, totalEntries: filtered.length };
  };

  const logWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    await localApi.weightLogs.create({
      date: new Date().toISOString().split('T')[0],
      weight,
      unit: preferences?.units || 'kg',
    });
    setNewWeight('');
    setShowWeightModal(false);
    loadData();
  };

  const exerciseChartData = getExerciseChartData();
  const exerciseStats = getExerciseStats();
  const weightChartData = getWeightChartData();
  const weightStats = getWeightStats();

  const chartWidth = SCREEN_WIDTH - 64;

  const renderExercisesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Exercise Selector */}
      <Pressable
        style={[styles.exerciseSelector, { backgroundColor: colors.inputBackground, borderRadius: borderRadius.lg }]}
        onPress={() => setShowExercisePicker(true)}
      >
        <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.exerciseSelectorText, { color: selectedExercise ? colors.textPrimary : colors.textSecondary }]}>
          {selectedExercise || 'Select an exercise'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

      {selectedExercise ? (
        <>
          {/* Chart Card with built-in filters */}
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Performance Trend</Text>
            
            {/* Date Range Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartFilterRow}>
              {dateRanges.map((range) => (
                <Pressable
                  key={range}
                  style={[
                    styles.chartFilterChip,
                    {
                      backgroundColor: exerciseRange === range ? colors.accentBlue : colors.inputBackground,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => setExerciseRange(range)}
                >
                  <Text style={[styles.chartFilterText, { color: exerciseRange === range ? '#FFF' : colors.textSecondary }]}>
                    {range}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Metric Toggle */}
            <View style={[styles.metricToggleContainer, { backgroundColor: colors.inputBackground, borderRadius: borderRadius.md }]}>
              {metrics.map((metric) => (
                <Pressable
                  key={metric.key}
                  style={[
                    styles.metricToggle,
                    {
                      backgroundColor: selectedMetric === metric.key ? colors.accentBlue : 'transparent',
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <Text style={[styles.metricToggleText, { color: selectedMetric === metric.key ? '#FFF' : colors.textSecondary }]}>
                    {metric.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {exerciseChartData.length > 0 ? (
              <LineChart
                data={exerciseChartData}
                width={chartWidth}
                height={200}
                color={colors.accentBlue}
                formatYLabel={(v) => {
                  if (selectedMetric === 'volume') {
                    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
                  }
                  return v.toFixed(0);
                }}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                  No data in selected range
                </Text>
              </View>
            )}
          </Card>

          {/* Stats Cards - Split into two rows */}
          {exerciseStats && exerciseStats.totalSessions > 0 && (
            <>
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="trophy" size={16} color={colors.warning} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max Weight</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {exerciseStats.maxWeight} {preferences?.units || 'kg'}
                  </Text>
                </Card>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="flash" size={16} color={colors.accentBlue} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Est. 1RM</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {exerciseStats.max1RM} {preferences?.units || 'kg'}
                  </Text>
                </Card>
              </View>
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="repeat" size={16} color={colors.success} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {exerciseStats.totalSessions}
                  </Text>
                </Card>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons
                      name={exerciseStats.trend === 'up' ? 'trending-up' : exerciseStats.trend === 'down' ? 'trending-down' : 'remove'}
                      size={16}
                      color={exerciseStats.trend === 'up' ? colors.success : exerciseStats.trend === 'down' ? colors.error : colors.textSecondary}
                    />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trend</Text>
                  </View>
                  <Text style={[
                    styles.statValue,
                    { color: exerciseStats.trend === 'up' ? colors.success : exerciseStats.trend === 'down' ? colors.error : colors.textPrimary }
                  ]}>
                    {exerciseStats.trend === 'up' ? '↑ Up' : exerciseStats.trend === 'down' ? '↓ Down' : '— Stable'}
                  </Text>
                </Card>
              </View>
            </>
          )}

          {/* Last Performed */}
          {exerciseStats?.lastPerformed && (
            <Text style={[styles.lastPerformed, { color: colors.textSecondary }]}>
              Last performed: {new Date(exerciseStats.lastPerformed).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
            Track Your Progress
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            Select an exercise above to see your lifting trends
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderWeightTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Add Weight Button */}
      <Pressable
        style={[styles.addWeightButton, { backgroundColor: colors.accentBlue, borderRadius: borderRadius.lg }]}
        onPress={() => setShowWeightModal(true)}
      >
        <Ionicons name="add" size={22} color="#FFF" />
        <Text style={styles.addWeightText}>Log Weight</Text>
      </Pressable>

      {weightChartData.length > 0 ? (
        <>
          {/* Weight Chart */}
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Body Weight Trend</Text>
            
            {/* Date Range Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartFilterRow}>
              {dateRanges.map((range) => (
                <Pressable
                  key={range}
                  style={[
                    styles.chartFilterChip,
                    {
                      backgroundColor: weightRange === range ? colors.success : colors.inputBackground,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => setWeightRange(range)}
                >
                  <Text style={[styles.chartFilterText, { color: weightRange === range ? '#FFF' : colors.textSecondary }]}>
                    {range}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <LineChart
              data={weightChartData}
              width={chartWidth}
              height={200}
              color={colors.success}
              formatYLabel={(v) => v.toFixed(1)}
            />
          </Card>

          {/* Weight Stats */}
          {weightStats && (
            <>
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="scale" size={18} color={colors.accentBlue} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {weightStats.current.toFixed(1)} {preferences?.units || 'kg'}
                  </Text>
                </Card>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons 
                      name={weightStats.trend === 'up' ? 'trending-up' : weightStats.trend === 'down' ? 'trending-down' : 'remove'} 
                      size={18} 
                      color={weightStats.trend === 'up' ? colors.error : weightStats.trend === 'down' ? colors.success : colors.textSecondary} 
                    />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trend</Text>
                  </View>
                  <Text style={[
                    styles.statValue, 
                    { color: weightStats.trend === 'up' ? colors.error : weightStats.trend === 'down' ? colors.success : colors.textPrimary }
                  ]}>
                    {weightStats.trend === 'up' ? 'Gaining' : weightStats.trend === 'down' ? 'Losing' : 'Stable'}
                  </Text>
                </Card>
              </View>

              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="arrow-up" size={18} color={colors.error} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {weightStats.highest.toFixed(1)} {preferences?.units || 'kg'}
                  </Text>
                </Card>
                <Card style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Ionicons name="arrow-down" size={18} color={colors.success} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lowest</Text>
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {weightStats.lowest.toFixed(1)} {preferences?.units || 'kg'}
                  </Text>
                </Card>
              </View>

              <Card style={styles.averagesCard}>
                <Text style={[styles.averagesTitle, { color: colors.textPrimary }]}>Averages</Text>
                <View style={styles.averagesRow}>
                  <View style={styles.averageItem}>
                    <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>Weekly</Text>
                    <Text style={[styles.averageValue, { color: colors.textPrimary }]}>
                      {weightStats.weeklyAvg.toFixed(1)} {preferences?.units || 'kg'}
                    </Text>
                  </View>
                  <View style={[styles.averageDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.averageItem}>
                    <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>Monthly</Text>
                    <Text style={[styles.averageValue, { color: colors.textPrimary }]}>
                      {weightStats.monthlyAvg.toFixed(1)} {preferences?.units || 'kg'}
                    </Text>
                  </View>
                </View>
              </Card>

              <Text style={[styles.totalEntries, { color: colors.textSecondary }]}>
                {weightStats.totalEntries} entries in selected period
              </Text>
            </>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="scale-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
            Track Your Weight
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            Log your body weight to see trends over time
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Progress</Text>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, selectedTab === 'exercises' && { borderBottomColor: colors.accentBlue, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('exercises')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'exercises' ? colors.accentBlue : colors.textSecondary }]}>
            Exercises
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === 'weight' && { borderBottomColor: colors.accentBlue, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('weight')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'weight' ? colors.accentBlue : colors.textSecondary }]}>
            Body Weight
          </Text>
        </Pressable>
      </View>

      {selectedTab === 'exercises' && renderExercisesTab()}
      {selectedTab === 'weight' && renderWeightTab()}

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Exercise</Text>
              <Pressable onPress={() => setShowExercisePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: borderRadius.md }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredExercises.length > 0 ? (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedExercise(item.name);
                      setShowExercisePicker(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={styles.exerciseMeta}>
                      <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
                        {item.count} sessions
                      </Text>
                      {selectedExercise === item.name && (
                        <Ionicons name="checkmark" size={20} color={colors.accentBlue} />
                      )}
                    </View>
                  </Pressable>
                )}
                style={styles.exerciseList}
              />
            ) : (
              <View style={styles.noExercises}>
                <Text style={[styles.noExercisesText, { color: colors.textSecondary }]}>
                  {uniqueExercises.length === 0 
                    ? 'Complete some workouts to track progress' 
                    : 'No exercises match your search'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Weight Log Modal */}
      <Modal visible={showWeightModal} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.weightModalOverlay}
        >
          <View style={[styles.weightModalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
            <Text style={[styles.weightModalTitle, { color: colors.textPrimary }]}>Log Body Weight</Text>
            <TextInput
              style={[styles.weightInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderRadius: borderRadius.md }]}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder={`Enter weight (${preferences?.units || 'kg'})`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => {
                  setShowWeightModal(false);
                  setNewWeight('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accentBlue }]}
                onPress={logWeight}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  exerciseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  exerciseSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filterRow: {
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 4,
  },
  metricToggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  metricToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chartFilterRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  chartFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    marginVertical: 0,
    minHeight: 80,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    flexWrap: 'wrap',
  },
  lastPerformed: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  addWeightText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  averagesCard: {
    marginBottom: 12,
  },
  averagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  averagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  averageValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  averageDivider: {
    width: 1,
    height: 40,
  },
  totalEntries: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  exerciseList: {
    maxHeight: 400,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseCount: {
    fontSize: 13,
  },
  noExercises: {
    padding: 40,
    alignItems: 'center',
  },
  noExercisesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  weightModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  weightModalContent: {
    width: '85%',
    padding: 24,
  },
  weightModalTitle: {
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
