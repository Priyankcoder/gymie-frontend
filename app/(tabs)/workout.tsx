
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, Button } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { Workout, Exercise, WorkoutSet, ExerciseInfo, PersonalRecord } from '../../src/types';

export default function WorkoutScreen() {
  const { colors, spacing, borderRadius } = useTheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exerciseList, setExerciseList] = useState<ExerciseInfo[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'log' | 'history' | 'prs'>('log');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            setShowRestTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  const loadData = async () => {
    const [workoutsRes, prsRes, exercisesRes] = await Promise.all([
      localApi.workouts.getAll(),
      localApi.prs.getAll(),
      localApi.exercises.getAll(),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (prsRes.data) setPersonalRecords(prsRes.data);
    if (exercisesRes.data) setExerciseList(exercisesRes.data);
  };

  const startNewWorkout = () => {
    const today = new Date().toISOString().split('T')[0];
    setActiveWorkout({
      id: '',
      date: today,
      name: 'New Workout',
      exercises: [],
      completed: false,
    });
  };

  const addExercise = (exercise: ExerciseInfo) => {
    if (!activeWorkout) return;

    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      name: exercise.name,
      sets: [{ id: `set-${Date.now()}`, reps: 0, weight: 0, completed: false }],
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newExercise],
    });
    setShowExerciseModal(false);
    setSearchQuery('');
  };

  const addSet = (exerciseId: string) => {
    if (!activeWorkout) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `set-${Date.now()}`,
                reps: lastSet?.reps || 0,
                weight: lastSet?.weight || 0,
                completed: false,
              },
            ],
          };
        }
        return ex;
      }),
    });
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!activeWorkout) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) => {
              if (set.id === setId) {
                return { ...set, ...updates };
              }
              return set;
            }),
          };
        }
        return ex;
      }),
    });
  };

  const completeSet = (exerciseId: string, setId: string) => {
    updateSet(exerciseId, setId, { completed: true });
    setRestTimeLeft(restTime);
    setShowRestTimer(true);
  };

  const saveWorkout = async () => {
    if (!activeWorkout) return;

    const completedWorkout = {
      ...activeWorkout,
      completed: true,
      duration: 45, // TODO: Calculate actual duration
    };

    await localApi.workouts.create(completedWorkout);
    setActiveWorkout(null);
    loadData();
  };

  const filteredExercises = exerciseList.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
      {(['log', 'history', 'prs'] as const).map((tab) => (
        <Pressable
          key={tab}
          style={[
            styles.tab,
            selectedTab === tab && { borderBottomColor: colors.accentBlue, borderBottomWidth: 2 },
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === tab ? colors.accentBlue : colors.textSecondary },
            ]}
          >
            {tab === 'log' ? 'Log' : tab === 'history' ? 'History' : 'PRs'}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderLogTab = () => (
    <View style={styles.tabContent}>
      {!activeWorkout ? (
        <View style={styles.startWorkoutContainer}>
          <Ionicons name="barbell-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.startWorkoutTitle, { color: colors.textPrimary }]}>
            Ready to Train?
          </Text>
          <Text style={[styles.startWorkoutSubtitle, { color: colors.textSecondary }]}>
            Start a new workout to track your exercises
          </Text>
          <Button title="Start Workout" onPress={startNewWorkout} size="lg" style={{ marginTop: 24 }} />
        </View>
      ) : (
        <ScrollView style={styles.workoutContainer} showsVerticalScrollIndicator={false}>
          <TextInput
            style={[
              styles.workoutNameInput,
              {
                color: colors.textPrimary,
                borderBottomColor: colors.border,
              },
            ]}
            value={activeWorkout.name}
            onChangeText={(text) => setActiveWorkout({ ...activeWorkout, name: text })}
            placeholder="Workout Name"
            placeholderTextColor={colors.textSecondary}
          />

          {activeWorkout.exercises.map((exercise) => (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                {exercise.name}
              </Text>
              <View style={styles.setsHeader}>
                <Text style={[styles.setLabel, { color: colors.textSecondary }]}>SET</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary }]}>WEIGHT</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary }]}>REPS</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary }]}></Text>
              </View>
              {exercise.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    value={set.weight > 0 ? set.weight.toString() : ''}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, { weight: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    value={set.reps > 0 ? set.reps.toString() : ''}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, { reps: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable
                    onPress={() => completeSet(exercise.id, set.id)}
                    style={[
                      styles.completeButton,
                      {
                        backgroundColor: set.completed ? colors.success : colors.inputBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={set.completed ? '#FFF' : colors.textSecondary}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                <Ionicons name="add" size={20} color={colors.accentBlue} />
                <Text style={[styles.addSetText, { color: colors.accentBlue }]}>Add Set</Text>
              </Pressable>
            </Card>
          ))}

          <Button
            title="Add Exercise"
            variant="outline"
            onPress={() => setShowExerciseModal(true)}
            style={{ marginVertical: 16 }}
          />

          <Button title="Finish Workout" onPress={saveWorkout} style={{ marginBottom: 100 }} />
        </ScrollView>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Workouts Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start logging your workouts to see history here
          </Text>
        </View>
      ) : (
        workouts.map((workout) => (
          <Card key={workout.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyName, { color: colors.textPrimary }]}>
                {workout.name}
              </Text>
              <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                {new Date(workout.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.historyExercises, { color: colors.textSecondary }]}>
              {workout.exercises.length} exercises • {workout.duration || 0} min
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );

  const renderPRsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {personalRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No PRs Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete workouts to track your personal records
          </Text>
        </View>
      ) : (
        personalRecords.map((pr) => (
          <Card key={pr.id} style={styles.prCard}>
            <View style={styles.prContent}>
              <View style={[styles.prIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Ionicons name="trophy" size={24} color={colors.warning} />
              </View>
              <View style={styles.prDetails}>
                <Text style={[styles.prExercise, { color: colors.textPrimary }]}>
                  {pr.exerciseName}
                </Text>
                <Text style={[styles.prMeta, { color: colors.textSecondary }]}>
                  {pr.reps} rep{pr.reps > 1 ? 's' : ''} • {new Date(pr.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.prValue, { color: colors.accentBlue }]}>
                {pr.value} {pr.unit}
              </Text>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Workout</Text>
      </View>

      {renderTabs()}

      {selectedTab === 'log' && renderLogTab()}
      {selectedTab === 'history' && renderHistoryTab()}
      {selectedTab === 'prs' && renderPRsTab()}

      {/* Exercise Selection Modal */}
      <Modal visible={showExerciseModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Exercise</Text>
              <Pressable onPress={() => setShowExerciseModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                  onPress={() => addExercise(item)}
                >
                  <Text style={[styles.exerciseItemName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.exerciseItemCategory, { color: colors.textSecondary }]}>
                    {item.category}
                  </Text>
                </Pressable>
              )}
              style={styles.exerciseList}
            />
          </View>
        </View>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal visible={showRestTimer} animationType="fade" transparent>
        <View style={[styles.timerOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.timerContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Rest Timer</Text>
            <Text style={[styles.timerValue, { color: colors.textPrimary }]}>
              {formatTime(restTimeLeft)}
            </Text>
            <View style={styles.timerButtons}>
              <Button
                title="-15s"
                variant="outline"
                size="sm"
                onPress={() => setRestTimeLeft((prev) => Math.max(0, prev - 15))}
              />
              <Button
                title="Skip"
                variant="secondary"
                onPress={() => {
                  setShowRestTimer(false);
                  setRestTimeLeft(0);
                }}
              />
              <Button
                title="+15s"
                variant="outline"
                size="sm"
                onPress={() => setRestTimeLeft((prev) => prev + 15)}
              />
            </View>
          </View>
        </View>
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
  },
  startWorkoutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  startWorkoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
  },
  startWorkoutSubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  workoutContainer: {
    flex: 1,
    paddingTop: 16,
  },
  workoutNameInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 13,
  },
  historyExercises: {
    fontSize: 13,
    marginTop: 4,
  },
  prCard: {
    marginBottom: 8,
  },
  prContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prDetails: {
    flex: 1,
    marginLeft: 12,
  },
  prExercise: {
    fontSize: 16,
    fontWeight: '600',
  },
  prMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 16,
  },
  exerciseList: {
    paddingHorizontal: 16,
  },
  exerciseItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseItemCategory: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  timerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    width: 280,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 64,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
