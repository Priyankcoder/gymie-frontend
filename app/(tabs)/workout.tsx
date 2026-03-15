import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "../../src/components/SafeAreaView";
import { Button, Card } from "../../src/components/ui";
import { useTheme } from "../../src/contexts/ThemeContext";
import prebuiltPlanTemplates from "../../src/data/prebuiltPlans";
import { api } from "../../src/services/api";
import {
  Exercise,
  ExerciseInfo,
  PersonalRecord,
  PlanRecurrence,
  ScheduledWorkout,
  TemplateExercise,
  Workout,
  WorkoutPlan,
  WorkoutPlanDay,
  WorkoutSet,
  WorkoutTemplate,
} from "../../src/types";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkoutScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const params = useLocalSearchParams();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exerciseList, setExerciseList] = useState<ExerciseInfo[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<
    ScheduledWorkout[]
  >([]);
  const [todaysWorkout, setTodaysWorkout] = useState<{
    scheduled: ScheduledWorkout | null;
    plan: WorkoutPlan | null;
    day: WorkoutPlanDay | null;
  }>({ scheduled: null, plan: null, day: null });

  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPrebuiltPlansModal, setShowPrebuiltPlansModal] = useState(false);
  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);
  const [showPlanCustomizationModal, setShowPlanCustomizationModal] =
    useState(false);
  const [showDayExercisesModal, setShowDayExercisesModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [customizingPlan, setCustomizingPlan] = useState<{
    name: string;
    description: string;
    type: WorkoutPlan["type"];
    days: WorkoutPlanDay[];
  } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [customizationScrollY, setCustomizationScrollY] = useState(0);
  const customizationScrollRef = React.useRef<ScrollView>(null);
  const [recurrenceSettings, setRecurrenceSettings] = useState<PlanRecurrence>({
    type: "weekly",
    interval: 1,
    startDate: new Date().toISOString().split("T")[0],
    restDays: [0], // Sunday
  });
  const [restTime, setRestTime] = useState(90);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"log" | "plans" | "history">(
    (params.tab as "log" | "plans" | "history") || "log"
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());
  const [autoRestTimer, setAutoRestTimer] = useState(false); // OFF by default
  const [showQuickRest, setShowQuickRest] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prDetails, setPRDetails] = useState<{
    exerciseName: string;
    weight: number;
    reps: number;
    previousBest?: number;
  } | null>(null);
  const [showWorkoutComplete, setShowWorkoutComplete] = useState(false);
  const [completedWorkoutStats, setCompletedWorkoutStats] = useState<{
    name: string;
    duration: number;
    exerciseCount: number;
    totalSets: number;
    totalVolume: number;
    prsAchieved: number;
  } | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<Workout | null>(null);

  // Animation refs
  const prEntryAnim = useRef(new Animated.Value(0)).current;
  const completeEntryAnim = useRef(new Animated.Value(0)).current;
  const setAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiParticles = useRef(
    Array.from({ length: 10 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const CONFETTI_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'];

  const triggerConfetti = () => {
    setShowConfetti(true);
    confettiParticles.forEach(p => {
      p.x.setValue(0); p.y.setValue(0); p.opacity.setValue(1); p.scale.setValue(1);
    });
    const anims = confettiParticles.map((p, i) => {
      const angle = ((i / confettiParticles.length) * 2 * Math.PI) - Math.PI / 2;
      const spread = 0.8;
      const dist = 100 + (i % 3) * 40;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: Math.cos(angle) * dist * spread, duration: 700, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * dist - 60, duration: 700, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
        Animated.timing(p.scale, { toValue: 0.2, duration: 700, delay: 100, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(anims).start(() => setShowConfetti(false));
  };

  const getSetAnim = (setId: string) => {
    if (!setAnimations[setId]) {
      setAnimations[setId] = new Animated.Value(1);
    }
    return setAnimations[setId];
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Check for tab parameter on focus
      if (params.tab) {
        setSelectedTab(params.tab as "log" | "plans" | "history");
      }
    }, [params.tab])
  );

  // Reload data when switching to history tab
  useEffect(() => {
    if (selectedTab === 'history') {
      loadData();
    }
  }, [selectedTab]);

  useEffect(() => {
    // Restore scroll position when returning to customization modal
    if (showPlanCustomizationModal && !showDayExercisesModal && customizationScrollRef.current) {
      setTimeout(() => {
        customizationScrollRef.current?.scrollTo({ y: customizationScrollY, animated: false });
      }, 100);
    }
  }, [showPlanCustomizationModal, showDayExercisesModal]);

  useEffect(() => {
    if (showPRCelebration) {
      prEntryAnim.setValue(0);
      Animated.spring(prEntryAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [showPRCelebration]);

  useEffect(() => {
    if (showWorkoutComplete) {
      completeEntryAnim.setValue(0);
      Animated.spring(completeEntryAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [showWorkoutComplete]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
    const [
      workoutsRes,
      prsRes,
      exercisesRes,
      templatesRes,
      plansRes,
      scheduledRes,
      todayRes,
    ] = await Promise.all([
      api.workouts.getAll(),
      api.prs.getAll(),
      api.exercises.getAll(),
      api.templates.getAll(),
      api.workoutPlans.getAll(),
      api.scheduledWorkouts.getAll(),
      api.scheduledWorkouts.getTodaysWorkout(),
    ]);

    const workoutsData: Workout[] = Array.isArray(workoutsRes)
      ? workoutsRes
      : (workoutsRes?.data && Array.isArray(workoutsRes.data) ? workoutsRes.data : []);
    setWorkouts(workoutsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    if (Array.isArray(prsRes)) setPersonalRecords(prsRes);
    else if (prsRes?.data) setPersonalRecords(prsRes.data);

    if (Array.isArray(exercisesRes)) setExerciseList(exercisesRes);
    else if (exercisesRes?.data) setExerciseList(exercisesRes.data);

    if (Array.isArray(templatesRes)) setTemplates(templatesRes);
    else if (templatesRes?.data) setTemplates(templatesRes.data);

    const plansData: WorkoutPlan[] = Array.isArray(plansRes)
      ? plansRes
      : (plansRes?.data || []);
    setWorkoutPlans(plansData);

    if (Array.isArray(scheduledRes)) setScheduledWorkouts(scheduledRes);
    else if (scheduledRes?.data) setScheduledWorkouts(scheduledRes.data);

    // Fix: properly unwrap the API response
    const todayData: { scheduled: ScheduledWorkout | null; plan: WorkoutPlan | null; day: WorkoutPlanDay | null } =
      todayRes?.data ?? { scheduled: null, plan: null, day: null };

    // Fallback: if no scheduled workout but active plan exists, compute today's day
    if (!todayData.scheduled && plansData.length > 0) {
      const activePlan = plansData.find((p) => p.isActive);
      if (activePlan) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const workoutDays = activePlan.days.filter((d) => !d.isRestDay);
        const isRestDay = activePlan.recurrence?.restDays?.includes(dayOfWeek) ?? false;

        if (!isRestDay && workoutDays.length > 0) {
          let dayIndex = 0;
          if (activePlan.recurrence?.startDate) {
            const start = new Date(activePlan.recurrence.startDate);
            start.setHours(0, 0, 0, 0);
            const todayMid = new Date(today);
            todayMid.setHours(0, 0, 0, 0);
            let count = 0;
            const cur = new Date(start);
            while (cur < todayMid) {
              if (!activePlan.recurrence.restDays?.includes(cur.getDay())) count++;
              cur.setDate(cur.getDate() + 1);
            }
            dayIndex = count;
          }
          todayData.plan = activePlan;
          todayData.day = workoutDays[dayIndex % workoutDays.length];
        }
      }
    }

    setTodaysWorkout(todayData);
  };

  const renderHistoryTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={60}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Workouts Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start logging your workouts to see history here
            </Text>
          </View>
        ) : (
          workouts.map((workout) => {
            // Calculate workout stats
            const totalSets = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
              0
            );
            const totalVolume = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.reduce(
                (setSum, set) => set.completed ? setSum + (set.weight * set.reps) : setSum,
                0
              ),
              0
            );
            
            // Find top 3 heaviest lifts
            const allLifts = workout.exercises.flatMap(ex =>
              ex.sets
                .filter(s => s.completed && s.weight > 0)
                .map(s => ({
                  exercise: ex.name,
                  weight: s.weight,
                  reps: s.reps,
                  volume: s.weight * s.reps
                }))
            );
            const topLifts = allLifts
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 3);
            
            // Check if any PRs (simplified - just check if this workout has high weights)
            const hasPotentialPR = allLifts.some(lift => lift.weight >= 50); // Threshold for "heavy"
            
            return (
              <Pressable
                key={workout.id}
                onPress={() => {
                  setSelectedWorkoutDetail(workout);
                  setShowWorkoutDetail(true);
                }}
              >
                <Card style={[styles.historyCard, { overflow: 'hidden' }]}>
                  {/* Header with gradient accent */}
                  <View style={styles.historyHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        style={[styles.historyName, { color: colors.textPrimary, fontSize: 18, fontWeight: '700' }]}
                      >
                        {workout.name}
                      </Text>
                      {hasPotentialPR && (
                        <View style={[styles.prBadgeSmall, { backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }]}>
                          <Text style={{ fontSize: 12, color: colors.warning }}>🏆 PR</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.historyDate, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}
                    >
                      {new Date(workout.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  {workout.completed && (
                    <View style={[styles.completedBadge, { backgroundColor: colors.success + '15', padding: 8, borderRadius: 12 }]}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.success}
                      />
                    </View>
                  )}
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[styles.statBox, { flex: 1, alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={16} color={colors.accentBlue} />
                      <Text style={[styles.statValue, { color: colors.accentBlue, fontSize: 18, fontWeight: '700' }]}>
                        {workout.duration || 0}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                      minutes
                    </Text>
                  </View>
                  <View style={[styles.statBox, { flex: 1, alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="fitness-outline" size={16} color={colors.success} />
                      <Text style={[styles.statValue, { color: colors.success, fontSize: 18, fontWeight: '700' }]}>
                        {totalSets}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                      sets
                    </Text>
                  </View>
                  <View style={[styles.statBox, { flex: 1, alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="barbell-outline" size={16} color={colors.warning} />
                      <Text style={[styles.statValue, { color: colors.warning, fontSize: 18, fontWeight: '700' }]}>
                        {Math.round(totalVolume)}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                      kg volume
                    </Text>
                  </View>
                </View>

                {/* Top Lifts */}
                {topLifts.length > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
                      💪 Top Lifts
                    </Text>
                    {topLifts.map((lift, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={[styles.exerciseName, { color: colors.textPrimary, fontSize: 14, flex: 1 }]}>
                          {i + 1}. {lift.exercise}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <Text style={[styles.liftStat, { color: colors.accentBlue, fontSize: 14, fontWeight: '600' }]}>
                            {lift.weight} kg
                          </Text>
                          <Text style={[styles.liftStat, { color: colors.textSecondary, fontSize: 12 }]}>
                            × {lift.reps}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Exercise Count */}
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={[styles.exerciseCount, { color: colors.textSecondary, fontSize: 12 }]}>
                    <Ionicons name="list-outline" size={12} /> {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} completed
                  </Text>
                </View>
              </Card>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const startNewWorkout = () => {
    const today = new Date().toISOString();
    setWorkoutStartTime(new Date());
    setActiveWorkout({
      id: "",
      date: today,
      name: "New Workout",
      exercises: [],
      completed: false,
    });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    const today = new Date().toISOString();
    setWorkoutStartTime(new Date());

    const exercises: Exercise[] = template.exercises.map((te, index) => ({
      id: `ex-${Date.now()}-${index}`,
      name: te.name,
      sets: Array.from({ length: te.targetSets }, (_, i) => ({
        id: `set-${Date.now()}-${index}-${i}`,
        reps: typeof te.targetReps === "number" ? te.targetReps : 10,
        weight: 0,
        completed: false,
      })),
    }));

    setActiveWorkout({
      id: "",
      date: today,
      name: template.name,
      exercises,
      completed: false,
      templateId: template.id,
    });
    setShowTemplateModal(false);
  };

  const startTodaysWorkout = () => {
    if (!todaysWorkout.day || !todaysWorkout.day.exercises) return;

    const today = new Date().toISOString();
    setWorkoutStartTime(new Date());

    const exercises: Exercise[] = todaysWorkout.day.exercises.map(
      (te, index) => ({
        id: `ex-${Date.now()}-${index}`,
        name: te.name,
        sets: Array.from({ length: te.targetSets }, (_, i) => ({
          id: `set-${Date.now()}-${index}-${i}`,
          reps: typeof te.targetReps === "number" ? te.targetReps : 10,
          weight: te.targetWeight || 0,
          completed: false,
        })),
      })
    );

    setActiveWorkout({
      id: "",
      date: today,
      name: todaysWorkout.day.name,
      exercises,
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
    setSearchQuery("");
  };

  const addExerciseToDay = (exercise: ExerciseInfo) => {
    if (!customizingPlan) return;

    const newExercise: TemplateExercise = {
      name: exercise.name,
      targetSets: 3,
      targetReps: 10,
    };

    const updatedDays = [...customizingPlan.days];
    updatedDays[selectedDayIndex] = {
      ...updatedDays[selectedDayIndex],
      exercises: [...updatedDays[selectedDayIndex].exercises, newExercise],
    };

    setCustomizingPlan({
      ...customizingPlan,
      days: updatedDays,
    });
    setShowDayExercisesModal(false);
    setSearchQuery("");
  };

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    if (!customizingPlan) return;

    const updatedDays = [...customizingPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      exercises: updatedDays[dayIndex].exercises.filter(
        (_, i) => i !== exerciseIndex
      ),
    };

    setCustomizingPlan({
      ...customizingPlan,
      days: updatedDays,
    });
  };

  const updateDayExercise = (
    dayIndex: number,
    exerciseIndex: number,
    updates: Partial<TemplateExercise>
  ) => {
    if (!customizingPlan) return;

    const updatedDays = [...customizingPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      exercises: updatedDays[dayIndex].exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, ...updates } : ex
      ),
    };

    setCustomizingPlan({
      ...customizingPlan,
      days: updatedDays,
    });
  };

  const toggleDayRestStatus = (dayIndex: number) => {
    if (!customizingPlan) return;

    const updatedDays = [...customizingPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      isRestDay: !updatedDays[dayIndex].isRestDay,
      // Don't remove exercises when toggling to rest day - just hide them
    };

    setCustomizingPlan({
      ...customizingPlan,
      days: updatedDays,
    });
  };

  const savePlanFromCustomization = async () => {
    if (!customizingPlan) return;

    const planData: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt"> = {
      name: customizingPlan.name,
      description: customizingPlan.description,
      type: customizingPlan.type,
      days: customizingPlan.days,
      isActive: editingPlanId ? workoutPlans.find(p => p.id === editingPlanId)?.isActive || false : workoutPlans.length === 0,
      color: "#3B82F6",
    };

    if (editingPlanId) {
      // Update existing plan
      await api.workoutPlans.update(editingPlanId, planData);
      setShowPlanCustomizationModal(false);
      setCustomizingPlan(null);
      setEditingPlanId(null);
      loadData();
    } else {
      // Create new plan
      const result = await api.workoutPlans.create(planData);
      setShowPlanCustomizationModal(false);
      setCustomizingPlan(null);

      // Show recurrence setup modal for the new plan
      if (result.data) {
        setSelectedPlan(result.data);
        setRecurrenceSettings({
          type: "weekly",
          interval: 1,
          startDate: new Date().toISOString().split("T")[0],
          restDays: [0],
        });
        setShowRecurrenceModal(true);
      }

      // Don't call loadData() here - wait until recurrence is saved or modal is closed
    }
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

  const updateSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>
  ) => {
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
    if (!activeWorkout) return;
    
    // Get the exercise and set details
    const exercise = activeWorkout.exercises.find(ex => ex.id === exerciseId);
    const set = exercise?.sets.find(s => s.id === setId);
    
    if (!exercise || !set) return;
    
    // Validate weight and reps are filled
    if (set.weight <= 0 || set.reps <= 0) {
      Alert.alert('Missing data', 'Enter weight and reps before completing the set.');
      return;
    }

    updateSet(exerciseId, setId, { completed: true });

    // Spring bounce animation on the check button
    const anim = getSetAnim(setId);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.4, tension: 220, friction: 5, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();

    // Trigger confetti burst
    triggerConfetti();

    // Check for PR (Personal Record)
    const isPR = checkForPR(exercise.name, set.weight, set.reps);
    
    if (isPR) {
      // 🏆 EPIC PR CELEBRATION!
      setPRDetails({
        exerciseName: exercise.name,
        weight: set.weight,
        reps: set.reps,
        previousBest: isPR.previousBest,
      });
      setShowPRCelebration(true);
      
      // Update personal records
      const newPR: PersonalRecord = {
        id: `pr-${Date.now()}`,
        exerciseName: exercise.name,
        weight: set.weight,
        reps: set.reps,
        date: new Date().toISOString(),
      };
      setPersonalRecords([...personalRecords, newPR]);
      
      // Save to API if available
      if (api.prs?.create) {
        api.prs.create(newPR).catch(err =>
          console.error('PR save failed:', err)
        );
      }
    } else {
      // Only auto-start timer if enabled
      if (autoRestTimer) {
        setRestTimeLeft(restTime);
        setShowRestTimer(true);
      } else {
        // Show quick rest actions (non-blocking)
        setShowQuickRest(true);
        setTimeout(() => setShowQuickRest(false), 3000);
      }
    }
  };
  
  // Check if this is a new PR by scanning ALL previous workouts AND current workout
  const checkForPR = (exerciseName: string, weight: number, reps: number): { previousBest?: number } | null => {
    // Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
    const current1RM = weight * (1 + reps / 30);
    
    // Search through ALL completed workouts to find all instances of this exercise
    let bestPrevious1RM = 0;
    let foundPreviousAttempts = false;
    
    // 1. Check historical workouts
    workouts.forEach(workout => {
      // Skip current workout (not saved yet) and incomplete workouts
      if (!workout.completed) return;
      
      workout.exercises.forEach(exercise => {
        // Case-insensitive match
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          // Check all completed sets for this exercise
          exercise.sets.forEach(set => {
            if (set.completed && set.weight > 0 && set.reps > 0) {
              foundPreviousAttempts = true;
              const set1RM = set.weight * (1 + set.reps / 30);
              if (set1RM > bestPrevious1RM) {
                bestPrevious1RM = set1RM;
              }
            }
          });
        }
      });
    });
    
    // 2. IMPORTANT: Also check OTHER completed sets in the current active workout
    if (activeWorkout) {
      activeWorkout.exercises.forEach(exercise => {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          exercise.sets.forEach(set => {
            // Check completed sets, but exclude the current set being checked
            if (set.completed && set.weight > 0 && set.reps > 0) {
              foundPreviousAttempts = true;
              const set1RM = set.weight * (1 + set.reps / 30);
              if (set1RM > bestPrevious1RM) {
                bestPrevious1RM = set1RM;
              }
            }
          });
        }
      });
    }
    
    if (!foundPreviousAttempts) {
      // First time doing this exercise - it's a PR!
      return { previousBest: undefined };
    }
    
    // Check if current is better (with small threshold to avoid floating point issues)
    if (current1RM > bestPrevious1RM + 0.5) {
      return { previousBest: Math.round(bestPrevious1RM) };
    }
    
    return null;
  };

  const saveWorkout = async () => {
    if (!activeWorkout) return;

    // Check if workout has exercises
    if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) {
      Alert.alert(
        'No Exercises',
        'Please add at least one exercise before finishing the workout.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Check if any sets are completed
    const hasCompletedSets = activeWorkout.exercises.some(ex =>
      ex.sets.some(s => s.completed)
    );

    if (!hasCompletedSets) {
      Alert.alert(
        'No Completed Sets',
        'Please complete at least one set before finishing the workout.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      const duration = workoutStartTime
        ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000)
        : 45;

      // Calculate workout stats - safe now that we've validated exercises exist
      const totalSets = activeWorkout.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
        0
      );
      const totalVolume = activeWorkout.exercises.reduce(
        (sum, ex) => sum + ex.sets.reduce(
          (setSum, set) => set.completed ? setSum + (set.weight * set.reps) : setSum,
          0
        ),
        0
      );

      // Count PRs achieved (check personalRecords added during this session)
      const prsAchieved = personalRecords.filter(pr =>
        activeWorkout.exercises.some(ex => ex.name === pr.exerciseName)
      ).length;

      // Remove id field for new workouts
      const { id, ...workoutData } = activeWorkout;
      
      const completedWorkout = {
        ...workoutData,
        completed: true,
        duration,
      };

      // Save workout and wait for completion
      const result = await api.workouts.create(completedWorkout);

      // Mark today's scheduled workout as completed if it exists
      if (todaysWorkout.scheduled && result.data) {
        await api.scheduledWorkouts.updateStatus(
          todaysWorkout.scheduled.id,
          "completed",
          result.data.id
        );
      }

      // Set completion stats
      setCompletedWorkoutStats({
        name: completedWorkout.name,
        duration,
        exerciseCount: completedWorkout.exercises.length,
        totalSets,
        totalVolume: Math.round(totalVolume),
        prsAchieved,
      });

      // Clear active workout
      setActiveWorkout(null);
      setWorkoutStartTime(null);
      
      await loadData();
      
      // Show game-style completion screen
      setShowWorkoutComplete(true);
      
    } catch (error) {
      console.error('❌ Error saving workout:', error);
      Alert.alert(
        'Error',
        'Failed to save workout. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    setWorkoutStartTime(null);
  };

  const selectPrebuiltPlan = (prebuiltId: string) => {
    const prebuilt = prebuiltPlanTemplates.find((p) => p.id === prebuiltId);
    if (!prebuilt) return;

    // Initialize customization with prebuilt template data
    setCustomizingPlan({
      name: prebuilt.name,
      description: prebuilt.description,
      type: prebuilt.type,
      days: prebuilt.days.map((day, index) => ({
        ...day,
        id: `day-${Date.now()}-${index}`,
      })),
    });

    setShowPrebuiltPlansModal(false);
    setShowPlanCustomizationModal(true);
  };

  const createPlanFromPrebuilt = async (prebuiltId: string) => {
    const prebuilt = prebuiltPlanTemplates.find((p) => p.id === prebuiltId);
    if (!prebuilt) return;

    const newPlan: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt"> = {
      name: prebuilt.name,
      description: prebuilt.description,
      type: prebuilt.type,
      days: prebuilt.days.map((day, index) => ({
        ...day,
        id: `day-${Date.now()}-${index}`,
      })),
      isActive: workoutPlans.length === 0,
      color: "#3B82F6",
    };

    const result = await api.workoutPlans.create(newPlan);
    setShowPrebuiltPlansModal(false);

    // Show recurrence setup modal for the new plan
    if (result.data) {
      setSelectedPlan(result.data);
      setRecurrenceSettings({
        type: "weekly",
        interval: 1,
        startDate: new Date().toISOString().split("T")[0],
        restDays: [0],
      });
      setShowRecurrenceModal(true);
    }

    // Don't call loadData() here - wait until recurrence is saved or modal is closed
  };

  const setActivePlan = async (planId: string) => {
    await api.workoutPlans.setActive(planId);
    loadData();
  };

  const deletePlan = async (planId: string) => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this workout plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await api.workoutPlans.delete(planId);
            setShowPlanDetailsModal(false);
            loadData();
          },
        },
      ]
    );
  };

  const clonePlan = async (planId: string) => {
    const plan = workoutPlans.find((p) => p.id === planId);
    if (!plan) return;

    await api.workoutPlans.clone(planId, `${plan.name} (Copy)`);
    loadData();
  };

  const startEditingPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setCustomizingPlan({
      name: plan.name,
      description: plan.description || "",
      type: plan.type,
      days: plan.days.map(day => ({ ...day })),
    });
    setShowPlanDetailsModal(false);
    setShowPlanCustomizationModal(true);
  };

  const saveRecurrence = async () => {
    if (!selectedPlan) return;

    await api.workoutPlans.setRecurrence(
      selectedPlan.id,
      recurrenceSettings
    );
    setShowRecurrenceModal(false);
    setShowPlanDetailsModal(false);
    loadData();
  };

  const toggleRestDay = (dayIndex: number) => {
    setRecurrenceSettings((prev) => ({
      ...prev,
      restDays: prev.restDays.includes(dayIndex)
        ? prev.restDays.filter((d) => d !== dayIndex)
        : [...prev.restDays, dayIndex],
    }));
  };

  const generateCalendarDays = () => {
    const days: {
      date: Date;
      scheduled: ScheduledWorkout | null;
      isCurrentMonth: boolean;
    }[] = [];
    const start = new Date(
      calendarStartDate.getFullYear(),
      calendarStartDate.getMonth(),
      1
    );
    const startDay = start.getDay();

    // Add previous month days
    const prevMonthEnd = new Date(start);
    prevMonthEnd.setDate(0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(prevMonthEnd);
      date.setDate(prevMonthEnd.getDate() - i);
      days.push({ date, scheduled: null, isCurrentMonth: false });
    }

    // Add current month days
    const daysInMonth = new Date(
      calendarStartDate.getFullYear(),
      calendarStartDate.getMonth() + 1,
      0
    ).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        calendarStartDate.getFullYear(),
        calendarStartDate.getMonth(),
        i
      );
      const dateStr = date.toISOString().split("T")[0];
      const scheduled =
        scheduledWorkouts.find((s) => s.date === dateStr) || null;
      days.push({ date, scheduled, isCurrentMonth: true });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(
        calendarStartDate.getFullYear(),
        calendarStartDate.getMonth() + 1,
        i
      );
      days.push({ date, scheduled: null, isCurrentMonth: false });
    }

    return days;
  };

  const filteredExercises = exerciseList.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
      {(["log", "plans", "history"] as const).map((tab) => (
        <Pressable
          key={tab}
          style={[
            styles.tab,
            selectedTab === tab && {
              borderBottomColor: colors.accentBlue,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === tab
                    ? colors.accentBlue
                    : colors.textSecondary,
              },
            ]}
          >
            {tab === "log" ? "Log" : tab === "plans" ? "Plans" : "History"}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderLogTab = () => (
    <View style={styles.tabContent}>
      {!activeWorkout ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Today's Completed Workouts */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const todaysCompletedWorkouts = workouts.filter(
              w => w.date.split('T')[0] === today && w.completed
            );

            return todaysCompletedWorkouts.length > 0 ? (
              <View style={{ marginBottom: 20, marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginLeft: 8 }]}>
                    Today's Completed Workouts
                  </Text>
                </View>
                {todaysCompletedWorkouts.map((workout) => {
                  const totalSets = workout.exercises.reduce(
                    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
                    0
                  );
                  const totalVolume = workout.exercises.reduce(
                    (sum, ex) => sum + ex.sets.reduce(
                      (setSum, set) => set.completed ? setSum + (set.weight * set.reps) : setSum,
                      0
                    ),
                    0
                  );

                  return (
                    <Pressable
                      key={workout.id}
                      onPress={() => {
                        setSelectedWorkoutDetail(workout);
                        setShowWorkoutDetail(true);
                      }}
                    >
                      <Card style={[styles.completedWorkoutCard, { marginBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={[styles.completedBadge, { backgroundColor: colors.success + '15', padding: 6, borderRadius: 8, marginRight: 12 }]}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.completedWorkoutName, { color: colors.textPrimary, fontSize: 16, fontWeight: '600' }]}>
                              {workout.name}
                            </Text>
                            <Text style={[styles.completedWorkoutTime, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>
                              Completed • {workout.duration || 0} min
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </View>
                        
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="fitness-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                              {totalSets} sets
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="barbell-outline" size={14} color={colors.warning} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                              {Math.round(totalVolume)} kg
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="list-outline" size={14} color={colors.accentBlue} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                              {workout.exercises.length} exercises
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ) : null;
          })()}

          {/* Today's Workout Card - Show if plan exists for today and not already completed */}
          {todaysWorkout.day && todaysWorkout.day.exercises && !workouts.some(w =>
            w.date.split('T')[0] === new Date().toISOString().split('T')[0] &&
            w.completed
          ) && (
            <Card style={styles.todaysWorkoutCard}>
              <View style={styles.todaysHeader}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={colors.accentBlue}
                />
                <Text
                  style={[styles.todaysTitle, { color: colors.textPrimary }]}
                >
                  Today's Scheduled Workout
                </Text>
              </View>
              <Text style={[styles.todaysName, { color: colors.textPrimary }]}>
                {todaysWorkout.day.name}
              </Text>
              <Text
                style={[styles.todaysPlan, { color: colors.textSecondary }]}
              >
                {todaysWorkout.plan?.name}
              </Text>
              <View style={styles.todaysExercises}>
                {todaysWorkout.day.exercises.slice(0, 3).map((ex, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.todaysExercise,
                      { color: colors.textSecondary },
                    ]}
                  >
                    • {ex.name} {ex.targetSets}×{ex.targetReps}
                  </Text>
                ))}
                {todaysWorkout.day.exercises.length > 3 && (
                  <Text
                    style={[styles.todaysMore, { color: colors.textSecondary }]}
                  >
                    +{todaysWorkout.day.exercises.length - 3} more
                  </Text>
                )}
              </View>
              <Button
                title="Start Workout"
                onPress={startTodaysWorkout}
                style={{ marginTop: 12 }}
              />
            </Card>
          )}

          {/* Start New Workout Section - Only show if no workouts completed today */}
          {!workouts.some(w => w.date.split('T')[0] === new Date().toISOString().split('T')[0] && w.completed) && (
            <View style={styles.startWorkoutContainer}>
              <View style={[styles.startWorkoutIconWrap, { backgroundColor: `${colors.accentBlue}15` }]}>
                <Ionicons name="barbell-outline" size={40} color={colors.accentBlue} />
              </View>
              <Text style={[styles.startWorkoutTitle, { color: colors.textPrimary }]}>
                {todaysWorkout.day ? "Custom Workout" : "Ready to train?"}
              </Text>
              <Text style={[styles.startWorkoutSubtitle, { color: colors.textSecondary }]}>
                {todaysWorkout.day
                  ? "Skip the plan and go freestyle"
                  : "Start a blank session and track as you go"}
              </Text>
              <Button
                title="Start empty workout"
                variant="outline"
                onPress={startNewWorkout}
                style={{ marginTop: 20 }}
                icon={<Ionicons name="add" size={18} color={colors.accentBlue} style={{ marginRight: 6 }} />}
              />
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.workoutContainer}
          showsVerticalScrollIndicator={false}
        >
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
              onChangeText={(text) =>
                setActiveWorkout({ ...activeWorkout, name: text })
              }
              placeholder="Workout Name"
              placeholderTextColor={colors.textSecondary}
            />
            <Pressable onPress={cancelWorkout}>
              <Ionicons name="close-circle" size={28} color={colors.error} />
            </Pressable>
          </View>

          {/* Auto-Timer Setting */}
          <View style={[styles.settingsRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingsInfo}>
              <Ionicons name="timer-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.settingsText, { color: colors.textPrimary }]}>
                Auto Rest Timer
              </Text>
            </View>
            <Switch
              value={autoRestTimer}
              onValueChange={setAutoRestTimer}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#fff"
            />
          </View>

          {activeWorkout.exercises.map((exercise) => (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <Text
                style={[styles.exerciseName, { color: colors.textPrimary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {exercise.name}
              </Text>
              {/* Sets header */}
              <View style={[styles.setsHeader, { paddingHorizontal: 0 }]}>
                <Text style={[styles.setLabel, { color: colors.textSecondary, width: 28 }]}>SET</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, flex: 1, textAlign: 'center' }]}>KG</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, width: 16, textAlign: 'center' }]}></Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, flex: 1, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.setLabel, { color: colors.textSecondary, width: 44 }]}></Text>
              </View>

              {exercise.sets.map((set, index) => (
                <View
                  key={set.id}
                  style={[
                    styles.setRow,
                    set.completed && { opacity: 0.55 },
                  ]}
                >
                  {/* Set number badge */}
                  <View style={[styles.setNumberBadge, { backgroundColor: set.completed ? colors.success : colors.inputBackground }]}>
                    <Text style={[styles.setNumber, { color: set.completed ? '#FFF' : colors.textSecondary, fontSize: 12 }]}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Weight input */}
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: set.completed ? 'transparent' : colors.inputBackground,
                        color: set.completed ? colors.textSecondary : colors.textPrimary,
                        borderRadius: borderRadius.sm,
                        borderWidth: set.completed ? 1 : 0,
                        borderColor: colors.border,
                      },
                    ]}
                    value={set.weight > 0 ? set.weight.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, { weight: parseFloat(text) || 0 })
                    }
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textSecondary}
                    editable={!set.completed}
                  />

                  {/* × separator */}
                  <Text style={{ color: colors.textSecondary, width: 16, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>×</Text>

                  {/* Reps input */}
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: set.completed ? 'transparent' : colors.inputBackground,
                        color: set.completed ? colors.textSecondary : colors.textPrimary,
                        borderRadius: borderRadius.sm,
                        borderWidth: set.completed ? 1 : 0,
                        borderColor: colors.border,
                      },
                    ]}
                    value={set.reps > 0 ? set.reps.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, { reps: parseInt(text) || 0 })
                    }
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textSecondary}
                    editable={!set.completed}
                  />

                  {/* Check button */}
                  <Animated.View style={{ transform: [{ scale: getSetAnim(set.id) }] }}>
                    <Pressable
                      onPress={() => set.completed ? null : completeSet(exercise.id, set.id)}
                      onLongPress={() => removeSet(exercise.id, set.id)}
                      style={[
                        styles.completeButton,
                        {
                          backgroundColor: set.completed ? colors.success : `${colors.success}20`,
                          borderRadius: borderRadius.sm,
                        },
                      ]}
                    >
                      <Ionicons
                        name={set.completed ? "checkmark" : "checkmark-outline"}
                        size={18}
                        color={set.completed ? "#FFF" : colors.success}
                      />
                    </Pressable>
                  </Animated.View>
                </View>
              ))}
              <Pressable
                style={styles.addSetButton}
                onPress={() => addSet(exercise.id)}
              >
                <Ionicons name="add" size={20} color={colors.accentBlue} />
                <Text style={[styles.addSetText, { color: colors.accentBlue }]}>
                  Add Set
                </Text>
              </Pressable>
            </Card>
          ))}

          <Button
            title="Add Exercise"
            variant="outline"
            onPress={() => setShowExerciseModal(true)}
            style={{ marginVertical: 16 }}
          />

          <Button
            title="Finish Workout"
            onPress={saveWorkout}
            disabled={!activeWorkout?.exercises || activeWorkout.exercises.length === 0}
            style={{ marginBottom: 100 }}
          />
        </ScrollView>
      )}

      {/* Quick Rest Actions - Non-blocking */}
      {showQuickRest && !showRestTimer && activeWorkout && (
        <View style={[styles.quickRestBar, { backgroundColor: colors.success }]}>
          <View style={styles.quickRestContent}>
            <Text style={styles.quickRestText}>🔥 Great set!</Text>
            <View style={styles.quickRestButtons}>
              <Pressable
                style={[styles.quickRestButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => {
                  setRestTimeLeft(60);
                  setShowRestTimer(true);
                  setShowQuickRest(false);
                }}
              >
                <Text style={styles.quickRestButtonText}>1:00</Text>
              </Pressable>
              <Pressable
                style={[styles.quickRestButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => {
                  setRestTimeLeft(90);
                  setShowRestTimer(true);
                  setShowQuickRest(false);
                }}
              >
                <Text style={styles.quickRestButtonText}>1:30</Text>
              </Pressable>
              <Pressable
                style={[styles.quickRestButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => {
                  setRestTimeLeft(120);
                  setShowRestTimer(true);
                  setShowQuickRest(false);
                }}
              >
                <Text style={styles.quickRestButtonText}>2:00</Text>
              </Pressable>
              <Pressable
                style={[styles.quickRestButton, { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                onPress={() => setShowQuickRest(false)}
              >
                <Ionicons name="close" size={18} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderPlansTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.plansHeader}>
        <Text style={[styles.plansTitle, { color: colors.textPrimary }]}>
          Workout Plans
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setShowCalendarModal(true)}
            style={[
              styles.iconButton,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.textPrimary}
            />
          </Pressable>
          <Button
            title="Create Plan"
            size="sm"
            onPress={() => setShowPrebuiltPlansModal(true)}
          />
        </View>
      </View>

      {workoutPlans.length === 0 ? (
        <View style={styles.emptyPlans}>
          <Ionicons
            name="calendar-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Plans Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Create a workout plan to schedule your training
          </Text>
        </View>
      ) : (
        workoutPlans.map((plan) => (
          <Card
            key={plan.id}
            style={
              plan.isActive
                ? { ...styles.planCard, borderColor: colors.accentBlue, borderWidth: 2 }
                : styles.planCard
            }
            onPress={() => {
              setSelectedPlan(plan);
              setShowPlanDetailsModal(true);
            }}
          >
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={[styles.planName, { color: colors.textPrimary }]}
                  >
                    {plan.name}
                  </Text>
                  {plan.isActive && (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: colors.accentBlue },
                      ]}
                    >
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
                {plan.description && (
                  <Text
                    style={[styles.planDesc, { color: colors.textSecondary }]}
                  >
                    {plan.description}
                  </Text>
                )}
                <Text
                  style={[styles.planDays, { color: colors.textSecondary }]}
                >
                  {plan.days.filter((d) => !d.isRestDay).length} workout days
                  {plan.recurrence && ` • ${plan.recurrence.type}`}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </Card>
        ))
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );


  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Workout
        </Text>
      </View>

      {renderTabs()}

      {selectedTab === "log" && renderLogTab()}
      {selectedTab === "plans" && renderPlansTab()}
      {selectedTab === "history" && renderHistoryTab()}

      {/* Exercise Selection Modal */}
      <Modal visible={showExerciseModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Add Exercise
              </Text>
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
                  style={[
                    styles.exerciseItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => addExercise(item)}
                >
                  <Text
                    style={[
                      styles.exerciseItemName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseItemCategory,
                      { color: colors.textSecondary },
                    ]}
                  >
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

      {/* Day Exercises Modal (for plan customization) */}
      <Modal
        visible={showDayExercisesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, flex: 1 }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Add Exercise to Day
              </Text>
              <Pressable onPress={() => setShowDayExercisesModal(false)}>
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
                  style={[
                    styles.exerciseItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => addExerciseToDay(item)}
                >
                  <Text
                    style={[
                      styles.exerciseItemName,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseItemCategory,
                      { color: colors.textSecondary },
                    ]}


                  >
                    {item.category}
                  </Text>
                </Pressable>
              )}
              style={styles.exerciseList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Template Selection Modal */}
      <Modal visible={showTemplateModal} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.templateModalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Choose Template
              </Text>
              <Pressable onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.templateList}>
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateSelectItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => startFromTemplate(template)}
                >
                  <View
                    style={[
                      styles.templateSelectColor,
                      { backgroundColor: template.color || colors.accentBlue },
                    ]}
                  />
                  <View style={styles.templateSelectInfo}>
                    <Text
                      style={[
                        styles.templateSelectName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {template.name}
                    </Text>
                    <Text
                      style={[
                        styles.templateSelectExercises,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {template.exercises.length} exercises
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Prebuilt Plans Modal */}
      <Modal visible={showPrebuiltPlansModal} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.prebuiltModalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Choose a Plan
              </Text>
              <Pressable onPress={() => setShowPrebuiltPlansModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.prebuiltList}>
              {prebuiltPlanTemplates.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.prebuiltItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => selectPrebuiltPlan(plan.id)}
                >
                  <View style={styles.prebuiltInfo}>
                    <Text
                      style={[
                        styles.prebuiltName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <Text
                      style={[
                        styles.prebuiltDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {plan.description}
                    </Text>
                    <View style={styles.prebuiltMeta}>
                      <Text
                        style={[
                          styles.prebuiltMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {plan.daysPerWeek} days/week • {plan.level}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Plan Customization Modal - Improved UI */}
      <Modal
        visible={showPlanCustomizationModal && !showDayExercisesModal}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.customizationModalContainer,
              { backgroundColor: colors.card },
            ]}
          >
            {/* Enhanced Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingPlanId ? "Edit Workout Plan" : "Customize Plan"}
                </Text>
                {editingPlanId && customizingPlan && (
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {customizingPlan.days.filter(d => !d.isRestDay).length} workout days • {customizingPlan.days.filter(d => d.isRestDay).length} rest days
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => {
                  setShowPlanCustomizationModal(false);
                  setCustomizingPlan(null);
                  setEditingPlanId(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              ref={customizationScrollRef}
              style={styles.customizationScrollView}
              contentContainerStyle={styles.customizationContent}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              onScroll={(event) => {
                setCustomizationScrollY(event.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
            >
              {/* Plan Name */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  PLAN NAME
                </Text>
                <TextInput
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter plan name"
                  placeholderTextColor={colors.textSecondary}
                  value={customizingPlan?.name || ""}
                  onChangeText={(text) =>
                    setCustomizingPlan((prev) =>
                      prev ? { ...prev, name: text } : null
                    )
                  }
                />
              </View>

              {/* Plan Description */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  DESCRIPTION (OPTIONAL)
                </Text>
                <TextInput
                  style={[
                    styles.customInput,
                    styles.textArea,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Add a description"
                  placeholderTextColor={colors.textSecondary}
                  value={customizingPlan?.description || ""}
                  onChangeText={(text) =>
                    setCustomizingPlan((prev) =>
                      prev ? { ...prev, description: text } : null
                    )
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Workout Days Section - Enhanced */}
              <View style={styles.customizationSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.textPrimary }]}
                  >
                    Workout Days
                  </Text>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Configure exercises for each day
                  </Text>
                </View>
              </View>

              {customizingPlan?.days.map((day, dayIndex) => (
                <View
                  key={day.id}
                  style={[
                    styles.customDayCard,
                    {
                      backgroundColor: day.isRestDay ? colors.surface : colors.inputBackground,
                      borderLeftWidth: 3,
                      borderLeftColor: day.isRestDay ? colors.textSecondary : colors.accentBlue,
                    },
                  ]}
                >
                  {/* Enhanced Day Header */}
                  <View style={styles.customDayHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.dayHeaderRow}>
                        <Text
                          style={[
                            styles.customDayName,
                            { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
                          ]}
                        >
                          Day {dayIndex + 1}
                        </Text>
                        {day.isRestDay && (
                          <View style={[styles.restBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                            <Text style={[styles.restBadgeText, { color: colors.textSecondary }]}>
                              Rest Day
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.customDayTitle,
                          { color: colors.textPrimary, marginTop: 2 },
                        ]}
                      >
                        {day.name}
                      </Text>
                      {!day.isRestDay && day.exercises.length > 0 && (
                        <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
                          {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.restToggleContainer}>
                      <Text
                        style={[
                          styles.restToggleLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Rest Day
                      </Text>
                      <Switch
                        value={day.isRestDay}
                        onValueChange={() => toggleDayRestStatus(dayIndex)}
                        trackColor={{
                          false: colors.border,
                          true: colors.accentBlue,
                        }}
                        thumbColor={colors.card}
                      />
                    </View>
                  </View>

                  {!day.isRestDay && (
                    <>
                      {day.exercises.length > 0 ? (
                        <View style={styles.customExercisesList}>
                          {day.exercises.map((exercise, exerciseIndex) => (
                            <View
                              key={exerciseIndex}
                              style={[
                                styles.customExerciseRow,
                                {
                                  borderBottomWidth:
                                    exerciseIndex < day.exercises.length - 1
                                      ? 1
                                      : 0,
                                  borderBottomColor: colors.border,
                                  paddingVertical: 12,
                                },
                              ]}
                            >
                              <View style={styles.customExerciseInfo}>
                                <View style={styles.exerciseNameRow}>
                                  <Text
                                    style={[
                                      styles.customExerciseName,
                                      { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
                                    ]}
                                  >
                                    {exerciseIndex + 1}. {exercise.name}
                                  </Text>
                                </View>
                                {/* Simplified Target Inputs */}
                                <View style={[styles.customTargetInputs, { marginTop: 8 }]}>
                                  <View style={styles.compactInputGroup}>
                                    <TextInput
                                      style={[
                                        styles.compactInput,
                                        {
                                          color: colors.textPrimary,
                                          borderColor: colors.border,
                                          backgroundColor: colors.card,
                                        },
                                      ]}
                                      keyboardType="number-pad"
                                      value={String(exercise.targetSets || 3)}
                                      onChangeText={(text) =>
                                        updateDayExercise(
                                          dayIndex,
                                          exerciseIndex,
                                          { targetSets: parseInt(text) || 3 }
                                        )
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.compactInputLabel,
                                        { color: colors.textSecondary },
                                      ]}
                                    >
                                      sets
                                    </Text>
                                  </View>
                                  <Text
                                    style={[
                                      styles.targetSeparator,
                                      { color: colors.textSecondary, marginHorizontal: 8 },
                                    ]}
                                  >
                                    ×
                                  </Text>
                                  <View style={styles.compactInputGroup}>
                                    <TextInput
                                      style={[
                                        styles.compactInput,
                                        {
                                          color: colors.textPrimary,
                                          borderColor: colors.border,
                                          backgroundColor: colors.card,
                                          width: 65,
                                        },
                                      ]}
                                      keyboardType="default"
                                      value={String(exercise.targetReps || '8-12')}
                                      onChangeText={(text) =>
                                        updateDayExercise(
                                          dayIndex,
                                          exerciseIndex,
                                          { targetReps: text || '8-12' }
                                        )
                                      }
                                      placeholder="8-12"
                                      placeholderTextColor={colors.textSecondary}
                                    />
                                    <Text
                                      style={[
                                        styles.compactInputLabel,
                                        { color: colors.textSecondary },
                                      ]}
                                    >
                                      reps
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <Pressable
                                onPress={() =>
                                  removeExerciseFromDay(dayIndex, exerciseIndex)
                                }
                                style={[styles.customRemoveBtn, { padding: 8 }]}
                                hitSlop={8}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={20}
                                  color={colors.error}
                                />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={[styles.emptyExercisesContainer, { paddingVertical: 24 }]}>
                          <Ionicons
                            name="barbell-outline"
                            size={36}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.emptyExercisesText,
                              { color: colors.textSecondary, marginTop: 8 },
                            ]}
                          >
                            No exercises added yet
                          </Text>
                        </View>
                      )}

                      <Pressable
                       style={[
                         styles.customAddExerciseBtn,
                         {
                           borderColor: colors.accentBlue,
                           backgroundColor: colors.accentBlue + '08',
                           marginTop: 12,
                         },
                       ]}
                       onPress={() => {
                         setSelectedDayIndex(dayIndex);
                         setShowDayExercisesModal(true);
                       }}
                     >
                        <Ionicons
                          name="add-circle"
                          size={22}
                          color={colors.accentBlue}
                        />
                        <Text
                          style={[
                            styles.customAddExerciseText,
                            { color: colors.accentBlue, fontWeight: '600' },
                          ]}
                        >
                          Add Exercise
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ))}

              {/* Enhanced Save Button */}
              <Button
                title={editingPlanId ? "Save Changes" : "Save & Setup Schedule"}
                onPress={savePlanFromCustomization}
                style={[styles.customSaveBtn, { paddingVertical: 16 }]}
                disabled={!customizingPlan?.name.trim()}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Plan Details Modal */}
      <Modal visible={showPlanDetailsModal} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[styles.planDetailsModal, { backgroundColor: colors.card }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedPlan?.name}
              </Text>
              <Pressable onPress={() => setShowPlanDetailsModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.planDetailsContent}>
              {selectedPlan?.description && (
                <Text
                  style={[
                    styles.planDetailsDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedPlan.description}
                </Text>
              )}

              {/* Recurrence Info */}
              {selectedPlan?.recurrence && (
                <Card style={styles.recurrenceCard}>
                  <View style={styles.recurrenceHeader}>
                    <Ionicons
                      name="repeat"
                      size={20}
                      color={colors.accentBlue}
                    />
                    <Text
                      style={[
                        styles.recurrenceTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Schedule: {selectedPlan.recurrence.type || "Not set"}
                    </Text>



                  </View>
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Start:{" "}
                    {selectedPlan.recurrence.startDate
                      ? new Date(
                          selectedPlan.recurrence.startDate
                        ).toLocaleDateString()
                      : "Not set"}
                  </Text>
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Rest days:{" "}
                    {selectedPlan.recurrence.restDays
                      ? selectedPlan.recurrence.restDays
                          .map((d) => DAYS_OF_WEEK[d])
                          .join(", ")
                      : "None"}
                  </Text>
                </Card>
              )}

              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                  Workout Days
                </Text>
                {!selectedPlan?.recurrence && (
                  <Pressable
                    onPress={() => {
                      if (selectedPlan) {
                        setRecurrenceSettings({
                          type: "weekly",
                          interval: 1,
                          startDate: new Date().toISOString().split("T")[0],
                          restDays: [0],
                        });
                        setShowRecurrenceModal(true);
                      }
                    }}
                  >
                    <Text
                      style={[styles.setupLink, { color: colors.accentBlue }]}
                    >
                      Setup Schedule
                    </Text>
                  </Pressable>
                )}
              </View>

              {selectedPlan?.days?.map((day, index) => (
                <Card key={day.id} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text
                      style={[styles.dayName, { color: colors.textPrimary }]}
                    >
                      Day {index + 1}: {day.name}
                    </Text>
                    {day.isRestDay && (
                      <Text
                        style={[
                          styles.restBadge,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Rest
                      </Text>
                    )}
                  </View>
                  {!day.isRestDay && day.exercises.length > 0 && (
                    <View style={styles.dayExercises}>
                      {day.exercises.map((ex, i) => (
                        <Text
                          key={i}
                          style={[
                            styles.dayExercise,
                            { color: colors.textSecondary },
                          ]}
                        >
                          • {ex.name} {ex.targetSets}×{ex.targetReps}
                        </Text>
                      ))}
                    </View>
                  )}
                </Card>
              ))}

              <View style={styles.planActions}>
                {/* Primary Action */}
                {!selectedPlan?.isActive && (
                  <Button
                    title="Set as Active"
                    onPress={() => {
                      if (selectedPlan) {
                        setActivePlan(selectedPlan.id);
                        setShowPlanDetailsModal(false);
                      }
                    }}
                    style={{ marginBottom: 8 }}
                  />
                )}
                
                {/* Secondary Actions Row */}
                <View style={styles.planActionsRow}>
                  <Button
                    title="Edit Plan"
                    variant="outline"
                    onPress={() => {
                      if (selectedPlan) {
                        startEditingPlan(selectedPlan);
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Clone Plan"
                    variant="outline"
                    onPress={() => {
                      if (selectedPlan) {
                        clonePlan(selectedPlan.id);
                        setShowPlanDetailsModal(false);
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
                
                {/* Destructive Action - Separated */}
                <View style={styles.planDangerZone}>
                  <Button
                    title="Delete Plan"
                    variant="outline"
                    onPress={() => {
                      if (selectedPlan) {
                        deletePlan(selectedPlan.id);
                      }
                    }}
                    style={{
                      borderColor: colors.error,
                      backgroundColor: `${colors.error}10`,
                    }}
                    textStyle={{ color: colors.error }}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Recurrence Setup Modal */}
      <Modal visible={showRecurrenceModal} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[styles.recurrenceModal, { backgroundColor: colors.card }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Setup Schedule
              </Text>
              <Pressable onPress={() => {
                setShowRecurrenceModal(false);
                loadData(); // Reload to show the new plan even without recurrence
              }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.recurrenceContent}>
              <Text
                style={[styles.recurrenceLabel, { color: colors.textPrimary }]}
              >
                Recurrence Type
              </Text>
              <View style={styles.recurrenceTypeRow}>
                {(["weekly", "biweekly", "monthly"] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.recurrenceTypeButton,
                      {
                        backgroundColor:
                          recurrenceSettings.type === type
                            ? colors.accentBlue
                            : colors.inputBackground,
                      },
                    ]}
                    onPress={() =>
                      setRecurrenceSettings((prev) => ({ ...prev, type }))
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceTypeText,
                        {
                          color:
                            recurrenceSettings.type === type
                              ? "#FFF"
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text
                style={[
                  styles.recurrenceLabel,
                  { color: colors.textPrimary, marginTop: 20 },
                ]}
              >
                Start Date
              </Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={recurrenceSettings.startDate}
                onChangeText={(text) =>
                  setRecurrenceSettings((prev) => ({
                    ...prev,
                    startDate: text,
                  }))
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />

              <Text
                style={[
                  styles.recurrenceLabel,
                  { color: colors.textPrimary, marginTop: 20 },
                ]}
              >
                Rest Days
              </Text>
              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: recurrenceSettings.restDays.includes(
                          index
                        )
                          ? colors.error
                          : colors.inputBackground,
                      },
                    ]}
                    onPress={() => toggleRestDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        {
                          color: recurrenceSettings.restDays.includes(index)
                            ? "#FFF"
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ marginTop: 32, marginBottom: 20, gap: 12 }}>
                <Button title="Save Schedule" onPress={saveRecurrence} />
                <Button
                  title="Skip for Now"
                  onPress={() => {
                    setShowRecurrenceModal(false);
                    loadData(); // Reload to show the new plan without recurrence
                  }}
                  variant="outline"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendarModal} animationType="slide" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[styles.calendarModal, { backgroundColor: colors.card }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Pressable
                onPress={() => {
                  const newDate = new Date(calendarStartDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarStartDate(newDate);
                }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.textPrimary}
                />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {calendarStartDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => {
                    const newDate = new Date(calendarStartDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCalendarStartDate(newDate);
                  }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.textPrimary}
                  />
                </Pressable>
                <Pressable onPress={() => setShowCalendarModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.calendarContent}>
              <View style={styles.calendarHeader}>
                {DAYS_OF_WEEK.map((day) => (
                  <Text
                    key={day}
                    style={[
                      styles.calendarHeaderDay,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((item, index) => {
                  const isToday =
                    item.date.toDateString() === new Date().toDateString();
                  return (
                    <View
                      key={index}
                      style={[
                        styles.calendarDay,
                        !item.isCurrentMonth && styles.calendarDayOtherMonth,
                        isToday && [
                          styles.calendarDayToday,
                          { borderColor: colors.accentBlue },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          {
                            color: item.isCurrentMonth
                              ? colors.textPrimary
                              : colors.textSecondary,
                          },
                          isToday && {
                            color: colors.accentBlue,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {item.date.getDate()}
                      </Text>
                      {item.scheduled && (
                        <View
                          style={[
                            styles.scheduledDot,
                            {
                              backgroundColor:
                                item.scheduled.status === "completed"
                                  ? colors.success
                                  : item.scheduled.status === "skipped"
                                  ? colors.error
                                  : colors.accentBlue,
                            },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal visible={showRestTimer} animationType="fade" transparent>
        <View
          style={[styles.timerOverlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}
        >
          <View style={[styles.timerContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              Rest Timer
            </Text>
            <Text style={[styles.timerValue, { color: colors.textPrimary }]}>
              {formatTime(restTimeLeft)}
            </Text>
            <View style={styles.timerButtons}>
              <Button
                title="-15s"
                variant="outline"
                size="sm"
                onPress={() =>
                  setRestTimeLeft((prev) => Math.max(0, prev - 15))
                }
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

      {/* 🎊 CONFETTI OVERLAY */}
      {showConfetti && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          {confettiParticles.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                opacity: p.opacity,
                transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
              }}
            />
          ))}
        </View>
      )}

      {/* 🏆 PR CELEBRATION MODAL */}
      <Modal visible={showPRCelebration} animationType="fade" transparent>
        <View style={[styles.prCelebrationOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]}>
          <Animated.View
            style={[
              styles.prCelebrationContent,
              {
                opacity: prEntryAnim,
                transform: [{ scale: prEntryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}
          >
            {/* Trophy */}
            <View style={[styles.prTrophyContainer, { backgroundColor: '#FFD70022' }]}>
              <Text style={styles.prTrophy}>🏆</Text>
            </View>

            <Text style={styles.prTitle}>NEW RECORD</Text>

            {prDetails && (
              <>
                <Text style={[styles.prExerciseName, { color: '#FFFFFF', marginBottom: 4 }]}>
                  {prDetails.exerciseName}
                </Text>
                <Text style={[styles.prSubtitle, { color: 'rgba(255,255,255,0.5)', marginBottom: 32 }]}>
                  {prDetails.weight} kg × {prDetails.reps} reps
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#FFD700', fontSize: 28, fontWeight: '900' }}>
                      {Math.round(prDetails.weight * (1 + prDetails.reps / 30))} kg
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                      Est. 1RM
                    </Text>
                  </View>
                  {prDetails.previousBest ? (
                    <>
                      <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.success, fontSize: 28, fontWeight: '900' }}>
                          +{Math.round(prDetails.weight * (1 + prDetails.reps / 30) - prDetails.previousBest)} kg
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                          Improvement
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: colors.success, fontSize: 24, fontWeight: '900' }}>First ever!</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                          this exercise
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}

            <Button
              title="Keep going →"
              onPress={() => {
                setShowPRCelebration(false);
                setPRDetails(null);
              }}
              style={{ marginTop: 32, minWidth: 220 }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* ✅ WORKOUT COMPLETE MODAL */}
      <Modal visible={showWorkoutComplete} animationType="fade" transparent>
        <View style={[styles.prCelebrationOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.prCelebrationContent,
                {
                  opacity: completeEntryAnim,
                  transform: [{ scale: completeEntryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                },
              ]}
            >
              {/* Badge */}
              <View style={[styles.prTrophyContainer, { backgroundColor: `${colors.success}22` }]}>
                <Text style={styles.prTrophy}>💪</Text>
              </View>

              <Text style={styles.prTitle}>DONE.</Text>

              {completedWorkoutStats && (
                <>
                  <Text style={[styles.prExerciseName, { color: '#FFFFFF', fontSize: 20, marginBottom: 4 }]}>
                    {completedWorkoutStats.name}
                  </Text>
                  <Text style={[styles.prSubtitle, { color: 'rgba(255,255,255,0.45)', marginBottom: 32, fontSize: 14 }]}>
                    {completedWorkoutStats.duration} min · {completedWorkoutStats.exerciseCount} exercises
                  </Text>

                  {/* Stats 2×2 grid */}
                  <View style={[styles.prDetailsCard, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, marginBottom: 0 }]}>
                    <View style={styles.statRow}>
                      <View style={styles.prStatItem}>
                        <Text style={[styles.prStatValue, { color: '#FFFFFF', fontSize: 32 }]}>
                          {completedWorkoutStats.totalSets}
                        </Text>
                        <Text style={[styles.prStatLabel, { color: 'rgba(255,255,255,0.45)' }]}>Sets</Text>
                      </View>
                      <View style={[styles.prStatDivider, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                      <View style={styles.prStatItem}>
                        <Text style={[styles.prStatValue, { color: colors.accentBlue, fontSize: 32 }]}>
                          {completedWorkoutStats.totalVolume}
                        </Text>
                        <Text style={[styles.prStatLabel, { color: 'rgba(255,255,255,0.45)' }]}>kg Volume</Text>
                      </View>
                    </View>
                    {completedWorkoutStats.prsAchieved > 0 && (
                      <>
                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 20 }}>🏆</Text>
                          <Text style={{ color: '#FFD700', fontSize: 15, fontWeight: '700' }}>
                            {completedWorkoutStats.prsAchieved} new PR{completedWorkoutStats.prsAchieved > 1 ? 's' : ''} this session
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </>
              )}

              <View style={{ width: '100%', gap: 12, marginTop: 32, marginBottom: 40 }}>
                <Button
                  title="See history"
                  onPress={() => {
                    setShowWorkoutComplete(false);
                    setCompletedWorkoutStats(null);
                    setSelectedTab('history');
                  }}
                />
                <Button
                  title="Close"
                  variant="outline"
                  onPress={() => {
                    setShowWorkoutComplete(false);
                    setCompletedWorkoutStats(null);
                  }}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </Modal>

      {/* 📋 WORKOUT DETAIL MODAL */}
      <Modal visible={showWorkoutDetail} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.workoutDetailModal, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.9, marginTop: SCREEN_HEIGHT * 0.1 }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingHorizontal: 20, paddingVertical: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: 22, fontWeight: '700' }]}>
                  {selectedWorkoutDetail?.name}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: 14, marginTop: 4 }]}>
                  {selectedWorkoutDetail && new Date(selectedWorkoutDetail.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowWorkoutDetail(false);
                  setSelectedWorkoutDetail(null);
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {selectedWorkoutDetail && (
                <>
                  {/* Summary Stats */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <View style={[styles.summaryStats, { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12 }]}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={24} color={colors.accentBlue} />
                        <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 4 }]}>
                          {selectedWorkoutDetail.duration || 0}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: 11 }]}>
                          minutes
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Ionicons name="fitness-outline" size={24} color={colors.success} />
                        <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 4 }]}>
                          {selectedWorkoutDetail.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: 11 }]}>
                          sets
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Ionicons name="barbell-outline" size={24} color={colors.warning} />
                        <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 4 }]}>
                          {Math.round(selectedWorkoutDetail.exercises.reduce((sum, ex) =>
                            sum + ex.sets.reduce((setSum, set) =>
                              set.completed ? setSum + (set.weight * set.reps) : setSum, 0
                            ), 0
                          ))}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: 11 }]}>
                          kg volume
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Exercises List */}
                  <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 }]}>
                      Exercises ({selectedWorkoutDetail.exercises.length})
                    </Text>
                    {selectedWorkoutDetail.exercises.map((exercise, exIndex) => (
                      <View key={exercise.id} style={[styles.exerciseDetailCard, { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, marginBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View style={[styles.exerciseNumber, { backgroundColor: colors.accentBlue + '20', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }]}>
                            <Text style={{ color: colors.accentBlue, fontWeight: '700', fontSize: 16 }}>
                              {exIndex + 1}
                            </Text>
                          </View>
                          <Text style={[styles.exerciseDetailName, { color: colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 }]}>
                            {exercise.name}
                          </Text>
                          {(() => {
                            // Check if this exercise has any PR sets
                            const hasPR = exercise.sets.some(set => {
                              if (!set.completed || set.weight === 0) return false;
                              // Calculate 1RM using Epley formula
                              const estimated1RM = set.weight * (1 + set.reps / 30);
                              // Check against historical PRs for this exercise
                              const exercisePRs = personalRecords.filter(pr => pr.exerciseName === exercise.name);
                              if (exercisePRs.length === 0) return true; // First time doing this exercise
                              const bestPR = Math.max(...exercisePRs.map(pr => pr.value * (1 + pr.reps / 30)));
                              return estimated1RM > bestPR;
                            });
                            
                            return hasPR && (
                              <View style={[styles.prBadgeSmall, { backgroundColor: colors.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 }]}>
                                <Text style={{ fontSize: 12, color: colors.warning, fontWeight: '600' }}>🏆 PR</Text>
                              </View>
                            );
                          })()}
                        </View>

                        {/* Sets Table */}
                        <View style={[styles.setsTable, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
                          {/* Table Header */}
                          <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <Text style={[styles.tableHeader, { color: colors.textSecondary, fontSize: 11, fontWeight: '600', width: 50 }]}>
                              SET
                            </Text>
                            <Text style={[styles.tableHeader, { color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' }]}>
                              WEIGHT
                            </Text>
                            <Text style={[styles.tableHeader, { color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' }]}>
                              REPS
                            </Text>
                            <Text style={[styles.tableHeader, { color: colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' }]}>
                              VOLUME
                            </Text>
                          </View>

                          {/* Sets Rows */}
                          {exercise.sets.map((set, setIndex) => (
                            <View
                              key={set.id}
                              style={[
                                styles.setRow,
                                {
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingVertical: 8,
                                  opacity: set.completed ? 1 : 0.4,
                                },
                              ]}
                            >
                              <View style={{ width: 50, flexDirection: 'row', alignItems: 'center' }}>
                                {set.completed && (
                                  <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 4 }} />
                                )}
                                <Text style={[styles.setNumber, { color: colors.textPrimary, fontSize: 14, fontWeight: '600' }]}>
                                  {setIndex + 1}
                                </Text>
                              </View>
                              <Text style={[styles.setValue, { color: colors.textPrimary, fontSize: 14, flex: 1, textAlign: 'center' }]}>
                                {set.weight} kg
                              </Text>
                              <Text style={[styles.setValue, { color: colors.textPrimary, fontSize: 14, flex: 1, textAlign: 'center' }]}>
                                {set.reps}
                              </Text>
                              <Text style={[styles.setValue, { color: colors.textSecondary, fontSize: 14, flex: 1, textAlign: 'center' }]}>
                                {set.weight * set.reps} kg
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Exercise Summary */}
                        <View style={[styles.exerciseSummary, { backgroundColor: colors.background, borderRadius: 8, padding: 12, marginTop: 12 }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                              <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: 11 }]}>
                                Total Volume
                              </Text>
                              <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>
                                {exercise.sets.reduce((sum, set) => set.completed ? sum + (set.weight * set.reps) : sum, 0)} kg
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: 11 }]}>
                                Best Set
                              </Text>
                              <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: 16, fontWeight: '700' }]}>
                                {(() => {
                                  const completedSets = exercise.sets.filter(s => s.completed && s.weight > 0);
                                  if (completedSets.length === 0) return 'N/A';
                                  const maxWeight = Math.max(...completedSets.map(s => s.weight));
                                  const bestSet = completedSets.find(s => s.weight === maxWeight);
                                  return `${maxWeight} kg × ${bestSet?.reps || 0}`;
                                })()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
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
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  todaysWorkoutCard: {
    marginTop: 16,
    marginBottom: 8,
  },
  todaysHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  todaysTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  todaysName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  todaysPlan: {
    fontSize: 14,
    marginBottom: 12,
  },
  todaysExercises: {
    gap: 4,
  },
  todaysExercise: {
    fontSize: 13,
  },
  todaysMore: {
    fontSize: 13,
    fontStyle: "italic",
  },
  startWorkoutContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  startWorkoutIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  startWorkoutTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
  },
  startWorkoutSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  startButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  workoutContainer: {
    flex: 1,
    paddingTop: 16,
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutNameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginRight: 12,
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    width: 28,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  setInput: {
    flex: 1,
    height: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  plansHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  plansTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPlans: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  planCard: {
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  planDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  planDays: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  historyCard: {
    marginTop: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  historyName: {
    fontSize: 17,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 13,
    marginTop: 2,
  },
  historyExercises: {
    fontSize: 13,
    marginBottom: 8,
  },
  historyPreview: {
    gap: 2,
  },
  historyExercise: {
    fontSize: 13,
  },
  prBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedBadge: {
    padding: 8,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    flex: 1,
  },
  liftStat: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCount: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseItemCategory: {
    fontSize: 13,
    marginTop: 2,
  },
  templateModalContent: {
    height: SCREEN_HEIGHT * 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  templateList: {
    flex: 1,
  },
  templateSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
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
    fontWeight: "600",
  },
  templateSelectExercises: {
    fontSize: 13,
    marginTop: 2,
  },
  prebuiltModalContent: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  prebuiltList: {
    flex: 1,
  },
  prebuiltItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  prebuiltInfo: {
    flex: 1,
  },
  prebuiltName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  prebuiltDesc: {
    fontSize: 14,
    marginBottom: 6,
  },
  prebuiltMeta: {
    flexDirection: "row",
    gap: 8,
  },
  prebuiltMetaText: {
    fontSize: 12,
  },
  planDetailsModal: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  planDetailsContent: {
    flex: 1,
  },
  planDetailsDesc: {
    fontSize: 15,
    marginBottom: 20,
  },
  recurrenceCard: {
    marginBottom: 20,
  },
  recurrenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recurrenceTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  recurrenceText: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  setupLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  restBadge: {
    fontSize: 13,
    fontStyle: "italic",
  },
  dayExercises: {
    gap: 4,
  },
  dayExercise: {
    fontSize: 13,
  },
  dayMore: {
    fontSize: 13,
    fontStyle: "italic",
  },
  planActions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  planActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  planDangerZone: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ff000020',
  },
  recurrenceModal: {
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  recurrenceContent: {
    flex: 1,
  },
  recurrenceLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  recurrenceTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  recurrenceTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  recurrenceTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateInput: {
    padding: 12,
    fontSize: 16,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    width: (SCREEN_WIDTH - 64) / 7 - 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarModal: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  calendarContent: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarHeaderDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: (SCREEN_WIDTH - 32) / 7,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayOtherMonth: {
    opacity: 0.4,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scheduledDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  timerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContent: {
    width: SCREEN_WIDTH * 0.8,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 24,
  },
  timerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  // PR Celebration Modal Styles
  prCelebrationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: -50,
    opacity: 0.9,
  },
  prCelebrationContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  prTrophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  prTrophy: {
    fontSize: 64,
  },
  prTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  prSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  prDetailsCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  prExerciseName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  prStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  prStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  prStatValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  prStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  prImprovement: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  prMotivation: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  completedWorkoutName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statDivider: {
    height: 1,
    marginVertical: 16,
  },
  prBadge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  prBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  quickRestBar: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickRestContent: {
    gap: 8,
  },
  quickRestText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickRestButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  quickRestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  quickRestButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Customization Modal Styles
  customizationModalContainer: {
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  customizationScrollView: {
    flex: 1,
  },
  customizationContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  customInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  customizationSectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  customDayCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  customDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  repRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  repRangeInput: {
    width: 45,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginRight: 6,
  },
  repRangeText: {
    fontSize: 13,
    fontWeight: "500",
    marginHorizontal: 6,
  },
  customDayName: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: 2,
  },
  customDayTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  restToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  restToggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  customExercisesList: {
    marginTop: 4,
  },
  customExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  customExerciseInfo: {
    flex: 1,
    marginRight: 12,
  },
  customExerciseName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  customTargetInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  targetInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  customTargetInput: {
    width: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginRight: 6,
  },
  targetInputLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  targetSeparator: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 4,
  },
  customRemoveBtn: {
    padding: 8,
    marginLeft: 4,
  },
  emptyExercisesContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyExercisesText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  customAddExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    borderStyle: "dashed",
    marginTop: 12,
  },
  customAddExerciseText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  customSaveBtn: {
    marginTop: 24,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  restBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseCount: {
    fontSize: 12,
    marginTop: 4,
  },
  restToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  restToggleButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactInputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactInput: {
    width: 50,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginRight: 6,
  },
  compactInputLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  workoutDetailModal: {
    flex: 1,
  },
  summaryStats: {
    flexDirection: 'row',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
  },
  exerciseDetailCard: {
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetailName: {
    fontSize: 16,
    fontWeight: '600',
  },
  setsTable: {
    marginTop: 8,
  },
  tableHeader: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    fontSize: 14,
  },
  exerciseSummary: {
    marginTop: 12,
  },
  completedWorkoutCard: {
    marginBottom: 12,
  },
  completedWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedWorkoutTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
