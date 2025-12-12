
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, Button, MetricRing } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import {
  Workout,
  Exercise,
  WorkoutSet,
  ExerciseInfo,
  PersonalRecord,
  WorkoutTemplate
} from '../../src/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WorkoutScreen() {
  const { colors, spacing, borderRadius } = useTheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exerciseList, setExerciseList] = useState<ExerciseInfo[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'log' | 'templates' | 'history'>('log');
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
    const [workoutsRes, prsRes, exercisesRes, templatesRes] = await Promise.all([
      localApi.workouts.getAll(),
      localApi.prs.getAll(),
      localApi.exercises.getAll(),
      localApi.templates.getAll(),
    ]);

    if (workoutsRes.data) setWorkouts(workoutsRes.data.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
    if (prsRes.data) setPersonalRecords(prsRes.data);
    if (exercisesRes.data) setExerciseList(exercisesRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
  };

  const startNewWorkout = () => {
    const today = new Date().toISOString().split('T')[0];
    setWorkoutStartTime(new Date());
    setActiveWorkout({
      id: '',
      date: today,
      name: 'New Workout',
      exercises: [],
      completed: false,
    });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    const today = new Date().toISOString().split('T')[0];
    setWorkoutStartTime(new Date());
    
    const exercises: Exercise[] = template.exercises.map((te, index) => ({
      id: `ex-${Date.now()}-${index}`,
      name: te.name,
      sets: Array.from({ length: te.targetSets }, (_, i) => ({
        id: `set-${Date.now()}-${index}-${i}`,
        reps: te.targetReps,
        weight: 0,
        completed: false,
      })),
    }));

    setActiveWorkout({
      id: '',
      date: today,
      name: template.name,
      exercises,
      completed: false,
      templateId: template.id,
    });
    setShowTemplateModal(false);
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

  const removeSet = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id === exerciseId && ex.sets.length > 1) {
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
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

    const duration = workoutStartTime 
      ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000)
      : 45;

    const completedWorkout = {
      ...activeWorkout,
      completed: true,
      duration,
    };

    await localApi.workouts.create(completedWorkout);
    setActiveWorkout(null);
    setWorkoutStartTime(null);
    loadData();
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    setWorkoutStartTime(null);
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
      {(['log', 'templates', 'history'] as const).map((tab) => (
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
            {tab === 'log' ? 'Log' : tab === 'templates' ? 'Plans' : 'History'}
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
            Start a new workout or use a template
          </Text>
          <View style={styles.startButtons}>
            <Button 
              title="Empty Workout" 
              variant="outline"
              onPress={startNewWorkout} 
              style={{ flex: 1 }} 
            />
            <Button 
              title="Use Template" 
              onPress={() => setShowTemplateModal(true)} 
              style={{ flex: 1 }} 
            />
          </View>
        </View>
      ) : (
        <ScrollView style={styles.workoutContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.workoutHeader}>
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
            <Pressable onPress={cancelWorkout}>
              <Ionicons name="close-circle" size={28} color={colors.error} />
            </Pressable>
          </View>

          {activeWorkout.exercises.map((exercise) => (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                {exercise.name}
              </Text>
              <View style={styles.setsHeader}>
                <Text style={[styles.setLabel, { color: colors.textSecondary, width: 30 }]}>SET</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, flex: 1 }]}>KG</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, flex: 1 }]}>REPS</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, width: 40 }]}></Text>
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
                    onPress={() => set.completed ? null : completeSet(exercise.id, set.id)}
                    onLongPress={() => removeSet(exercise.id, set.id)}
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

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.templatesTitle, { color: colors.textPrimary }]}>
        Workout Plans
      </Text>
      <Text style={[styles.templatesSubtitle, { color: colors.textSecondary }]}>
        Choose a template to start your workout
      </Text>
      
      {templates.map((template) => (
        <Card 
          key={template.id} 
          style={styles.templateCard}
          onPress={() => startFromTemplate(template)}
        >
          <View style={styles.templateHeader}>
            <View 
              style={[
                styles.templateColor, 
                { backgroundColor: template.color || colors.accentBlue }
              ]} 
            />
            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, { color: colors.textPrimary }]}>
                {template.name}
              </Text>
              {template.description && (
                <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
                  {template.description}
                </Text>
              )}
            </View>
            <Ionicons name="play-circle" size={32} color={colors.accentBlue} />
          </View>
          <View style={styles.templateExercises}>
            {template.exercises.slice(0, 4).map((ex, i) => (
              <Text key={i} style={[styles.templateExercise, { color: colors.textSecondary }]}>
                • {ex.name} ({ex.targetSets}×{ex.targetReps})
              </Text>
            ))}
            {template.exercises.length > 4 && (
              <Text style={[styles.templateMore, { color: colors.textSecondary }]}>
                +{template.exercises.length - 4} more exercises
              </Text>
            )}
          </View>
        </Card>
      ))}
      
      <View style={{ height: 100 }} />
    </ScrollView>
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
              <View>
                <Text style={[styles.historyName, { color: colors.textPrimary }]}>
                  {workout.name}
                </Text>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {new Date(workout.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              {workout.completed && (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              )}
            </View>
            <Text style={[styles.historyExercises, { color: colors.textSecondary }]}>
              {workout.exercises.length} exercises • {workout.duration || 0} min
            </Text>
            <View style={styles.historyPreview}>
              {workout.exercises.slice(0, 3).map((ex, i) => (
                <Text key={i} style={[styles.historyExercise, { color: colors.textSecondary }]}>
                  {ex.name}
                </Text>
              ))}
            </View>
          </Card>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Workout</Text>
      </View>

      {renderTabs()}

      {selectedTab === 'log' && renderLogTab()}
      {selectedTab === 'templates' && renderTemplatesTab()}
      {selectedTab === 'history' && renderHistoryTab()}

      {/* Exercise Selection Modal */}
      <Modal visible={showExerciseModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
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
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Template Selection Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.templateModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Template</Text>
              <Pressable onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.templateList}>
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[styles.templateSelectItem, { borderBottomColor: colors.border }]}
                  onPress={() => startFromTemplate(template)}
                >
                  <View 
                    style={[
                      styles.templateSelectColor, 
                      { backgroundColor: template.color || colors.accentBlue }
                    ]} 
                  />
                  <View style={styles.templateSelectInfo}>
                    <Text style={[styles.templateSelectName, { color: colors.textPrimary }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateSelectExercises, { color: colors.textSecondary }]}>
                      {template.exercises.length} exercises
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
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
    fontSize: 14,
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
  startButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  workoutContainer: {
    flex: 1,
    paddingTop: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutNameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginRight: 12,
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
  templatesTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  templatesSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  templateCard: {
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateColor: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
  },
  templateDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  templateExercises: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  templateExercise: {
    fontSize: 13,
    marginBottom: 4,
  },
  templateMore: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
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
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 13,
    marginTop: 2,
  },
  historyExercises: {
    fontSize: 13,
    marginTop: 8,
  },
  historyPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  historyExercise: {
    fontSize: 12,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  prsSection: {
    marginBottom: 20,
  },
  prsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: 15,
    fontWeight: '500',
  },
  prReps: {
    fontSize: 12,
    marginTop: 2,
  },
  prValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  prUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseProgressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  exerciseProgressName: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingBottom: 40,
  },
  templateModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  templateList: {
    padding: 16,
  },
  templateSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  templateSelectColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  templateSelectInfo: {
    flex: 1,
  },
  templateSelectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateSelectExercises: {
    fontSize: 13,
    marginTop: 2,
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
