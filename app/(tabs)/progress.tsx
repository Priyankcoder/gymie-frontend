
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, LineChart } from '../../src/components/ui';
import { useProgressData } from '../../src/hooks/progress/useProgressData';
import { usePhotoGallery } from '../../src/hooks/progress/usePhotoGallery';
import {
  DateRangeSelector,
  MetricSelector,
  ExerciseStatsCard,
  PhotoGallery,
  PhotoCompareView,
} from '../../src/components/features/progress/components';
import { AddWeightModal, AddProgressPhotoModal, PhotoCompareModal } from '../../src/components/features/progress/modals';

type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type MetricType = 'weight' | 'reps' | 'volume' | '1rm';

interface ChartDataPoint {
  date: string;
  value: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgressScreen() {
  const { colors, spacing, borderRadius } = useTheme();

  const {
    workouts,
    weightLogs,
    preferences,
    progressPhotos: initialPhotos,
    uniqueExercises,
    loading,
    refetch,
    getDateFilter,
    calculate1RM,
    getExerciseStats,
  } = useProgressData();

  const {
    progressPhotos,
    compareMode,
    selectedPhotos,
    setProgressPhotos,
    toggleCompareMode,
    togglePhotoSelection,
    pickProgressPhoto,
    takeProgressPhoto,
    saveProgressPhoto,
    deletePhoto,
    groupPhotosByMonth,
    formatMonthYear,
  } = usePhotoGallery(initialPhotos);

  const [selectedTab, setSelectedTab] = useState<'exercises' | 'weight' | 'photos'>('exercises');
  const [exerciseRange, setExerciseRange] = useState<DateRange>('3M');
  const [weightRange, setWeightRange] = useState<DateRange>('1M');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Handle photo capture from camera
  const handleTakePhoto = async () => {
    const uri = await takeProgressPhoto();
    if (uri) {
      setPendingPhotoUri(uri);
      setShowPhotoModal(true);
    }
  };

  // Handle photo selection from gallery
  const handlePickPhoto = async () => {
    const uri = await pickProgressPhoto();
    if (uri) {
      setPendingPhotoUri(uri);
      setShowPhotoModal(true);
    }
  };

  // Save photo with weight and notes
  const handleSavePhoto = async (weight?: number, notes?: string) => {
    if (pendingPhotoUri) {
      await saveProgressPhoto(pendingPhotoUri, weight, notes);
      setShowPhotoModal(false);
      setPendingPhotoUri(null);
      refetch(); // Refresh to show new photo
    }
  };

  // Auto-select most frequent exercise
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Auto-select first exercise when data loads
  React.useEffect(() => {
    if (!selectedExercise && uniqueExercises.length > 0) {
      setSelectedExercise(uniqueExercises[0].name);
    }
  }, [uniqueExercises, selectedExercise]);

  // Update photos state when data refreshes
  React.useEffect(() => {
    setProgressPhotos(initialPhotos);
  }, [initialPhotos, setProgressPhotos]);

  // Filter exercises by search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return uniqueExercises;
    return uniqueExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueExercises, searchQuery]);

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

  const exerciseChartData = getExerciseChartData();
  const exerciseStats = selectedExercise ? getExerciseStats(selectedExercise, exerciseRange) : null;
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
            
            <DateRangeSelector
              selected={exerciseRange}
              onSelect={setExerciseRange}
              color={colors.accentBlue}
            />

            <MetricSelector selected={selectedMetric} onSelect={setSelectedMetric} />

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

          {/* Stats Cards */}
          {exerciseStats && exerciseStats.totalSessions > 0 && (
            <ExerciseStatsCard
              maxWeight={exerciseStats.maxWeight}
              max1RM={exerciseStats.max1RM}
              totalSessions={exerciseStats.totalSessions}
              trend={exerciseStats.trend}
              unit={preferences?.units || 'kg'}
            />
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
            
            <DateRangeSelector
              selected={weightRange}
              onSelect={setWeightRange}
              color={colors.success}
            />

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

  const renderPhotosTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Compare Mode Toggle */}
      <View style={styles.photoHeader}>
        <Pressable
          style={[
            styles.compareModeToggle,
            {
              backgroundColor: compareMode ? colors.accentBlue : colors.card,
              borderColor: colors.border,
            }
          ]}
          onPress={toggleCompareMode}
        >
          <Ionicons
            name="git-compare-outline"
            size={18}
            color={compareMode ? '#FFF' : colors.textSecondary}
          />
          <Text style={[
            styles.compareModeText,
            { color: compareMode ? '#FFF' : colors.textSecondary }
          ]}>
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Text>
        </Pressable>
        
        <View style={styles.photoActions}>
          <Pressable
            style={[styles.photoActionButton, { backgroundColor: colors.card }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color={colors.accentBlue} />
          </Pressable>
          <Pressable
            style={[styles.photoActionButton, { backgroundColor: colors.card }]}
            onPress={handlePickPhoto}
          >
            <Ionicons name="images" size={20} color={colors.accentBlue} />
          </Pressable>
        </View>
      </View>

      {/* Compare View */}
      {compareMode && selectedPhotos.length === 2 && (
        <View style={styles.compareActions}>
          <Pressable
            style={[styles.compareButton, { backgroundColor: colors.accentBlue }]}
            onPress={() => setShowCompareModal(true)}
          >
            <Ionicons name="git-compare" size={20} color="#FFF" />
            <Text style={styles.compareButtonText}>Compare Photos</Text>
          </Pressable>
        </View>
      )}

      {/* Photo Grid */}
      {progressPhotos.length > 0 ? (
        <PhotoGallery
          photos={progressPhotos}
          groupedPhotos={groupPhotosByMonth()}
          compareMode={compareMode}
          selectedPhotos={selectedPhotos}
          onPhotoPress={(photoId) => {
            if (compareMode) {
              togglePhotoSelection(photoId);
            }
          }}
          onPhotoLongPress={deletePhoto}
          formatMonthYear={formatMonthYear}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
            Track Your Transformation
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            Take progress photos to visualize your fitness journey
          </Text>
          <Pressable
            style={[styles.emptyStateButton, { backgroundColor: colors.accentBlue }]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.emptyStateButtonText}>Take First Photo</Text>
          </Pressable>
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
        <Pressable
          style={[styles.tab, selectedTab === 'photos' && { borderBottomColor: colors.accentBlue, borderBottomWidth: 2 }]}
          onPress={() => setSelectedTab('photos')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'photos' ? colors.accentBlue : colors.textSecondary }]}>
            Photos
          </Text>
        </Pressable>
      </View>

      {selectedTab === 'exercises' && renderExercisesTab()}
      {selectedTab === 'weight' && renderWeightTab()}
      {selectedTab === 'photos' && renderPhotosTab()}

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Exercise</Text>
              <Pressable onPress={() => {
                setShowExercisePicker(false);
                setSearchQuery('');
              }}>
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

            {loading ? (
              <View style={styles.noExercises}>
                <Text style={[styles.noExercisesText, { color: colors.textSecondary }]}>
                  Loading exercises...
                </Text>
              </View>
            ) : filteredExercises.length > 0 ? (
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
      <AddWeightModal
        visible={showWeightModal}
        unit={preferences?.units || 'kg'}
        onClose={() => setShowWeightModal(false)}
        onSuccess={refetch}
      />

      {/* Progress Photo Modal */}
      <AddProgressPhotoModal
        visible={showPhotoModal}
        photoUri={pendingPhotoUri}
        units={preferences?.units || 'kg'}
        onClose={() => {
          setShowPhotoModal(false);
          setPendingPhotoUri(null);
        }}
        onSave={handleSavePhoto}
      />

      {/* Photo Compare Modal */}
      <PhotoCompareModal
        visible={showCompareModal}
        photos={progressPhotos}
        selectedPhotoIds={selectedPhotos}
        onClose={() => setShowCompareModal(false)}
      />
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
    marginBottom: 16,
    gap: 12,
  },
  exerciseSelectorText: {
    flex: 1,
    fontSize: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    marginTop: 12,
  },
  lastPerformed: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  addWeightText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  totalEntries: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compareModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  compareModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  compareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    height: 44,
    margin: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseName: {
    fontSize: 16,
    flex: 1,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
});
