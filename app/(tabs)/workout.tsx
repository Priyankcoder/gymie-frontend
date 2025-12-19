import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
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
    "log"
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    // Restore scroll position when returning to customization modal
    if (showPlanCustomizationModal && !showDayExercisesModal && customizationScrollRef.current) {
      setTimeout(() => {
        customizationScrollRef.current?.scrollTo({ y: customizationScrollY, animated: false });
      }, 100);
    }
  }, [showPlanCustomizationModal, showDayExercisesModal]);

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

    if (workoutsRes.data)
      setWorkouts(
        workoutsRes.data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    if (prsRes.data) setPersonalRecords(prsRes.data);
    if (exercisesRes.data) setExerciseList(exercisesRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (plansRes.data) setWorkoutPlans(plansRes.data);
    if (scheduledRes.data) setScheduledWorkouts(scheduledRes.data);
    if (todayRes.data) setTodaysWorkout(todayRes.data);
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
    updateSet(exerciseId, setId, { completed: true });
    setRestTimeLeft(restTime);
    setShowRestTimer(true);
  };

  const saveWorkout = async () => {
    if (!activeWorkout) return;

    const duration = workoutStartTime
      ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000)
      : 45;

    // Remove id field for new workouts
    const { id, ...workoutData } = activeWorkout;
    
    const completedWorkout = {
      ...workoutData,
      completed: true,
      duration,
    };

    const result = await api.workouts.create(completedWorkout);

    // Mark today's scheduled workout as completed if it exists
    if (todaysWorkout.scheduled && result.data) {
      await api.scheduledWorkouts.updateStatus(
        todaysWorkout.scheduled.id,
        "completed",
        result.data.id
      );
    }

    setActiveWorkout(null);
    setWorkoutStartTime(null);
    loadData();
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
          {/* Today's Workout Card */}
          {todaysWorkout.scheduled && todaysWorkout.day && todaysWorkout.day.exercises && (
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
                  Today's Workout
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

          <View style={styles.startWorkoutContainer}>
            <Ionicons
              name="barbell-outline"
              size={80}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.startWorkoutTitle, { color: colors.textPrimary }]}
            >
              {todaysWorkout.scheduled
                ? "Or Start Custom Workout"
                : "Ready to Train?"}
            </Text>
            <Text
              style={[
                styles.startWorkoutSubtitle,
                { color: colors.textSecondary },
              ]}
            >
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

          {activeWorkout.exercises.map((exercise) => (
            <Card key={exercise.id} style={styles.exerciseCard}>
              <Text
                style={[styles.exerciseName, { color: colors.textPrimary }]}
              >
                {exercise.name}
              </Text>
              <View style={styles.setsHeader}>
                <Text
                  style={[
                    styles.setLabel,
                    { color: colors.textSecondary, width: 30 },
                  ]}
                >
                  SET
                </Text>
                <Text
                  style={[
                    styles.setLabel,
                    { color: colors.textSecondary, flex: 1 },
                  ]}
                >
                  KG
                </Text>
                <Text
                  style={[
                    styles.setLabel,
                    { color: colors.textSecondary, flex: 1 },
                  ]}
                >
                  REPS
                </Text>
                <Text
                  style={[
                    styles.setLabel,
                    { color: colors.textSecondary, width: 40 },
                  ]}
                ></Text>
              </View>
              {exercise.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text
                    style={[styles.setNumber, { color: colors.textSecondary }]}
                  >
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
                    value={set.weight > 0 ? set.weight.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, {
                        weight: parseFloat(text) || 0,
                      })
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
                    value={set.reps > 0 ? set.reps.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, set.id, {
                        reps: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable
                    onPress={() =>
                      set.completed ? null : completeSet(exercise.id, set.id)
                    }
                    onLongPress={() => removeSet(exercise.id, set.id)}
                    style={[
                      styles.completeButton,
                      {
                        backgroundColor: set.completed
                          ? colors.success
                          : colors.inputBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={set.completed ? "#FFF" : colors.textSecondary}
                    />
                  </Pressable>
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
            style={{ marginBottom: 100 }}
          />
        </ScrollView>
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

  const renderHistoryTab = () => (
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
        workouts.map((workout) => (
          <Card key={workout.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text
                  style={[styles.historyName, { color: colors.textPrimary }]}
                >
                  {workout.name}
                </Text>
                <Text
                  style={[styles.historyDate, { color: colors.textSecondary }]}
                >
                  {new Date(workout.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
              {workout.completed && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              )}
            </View>
            <Text
              style={[styles.historyExercises, { color: colors.textSecondary }]}
            >
              {workout.exercises.length} exercises • {workout.duration || 0} min
            </Text>
            <View style={styles.historyPreview}>
              {workout.exercises.slice(0, 3).map((ex, i) => (
                <Text
                  key={i}
                  style={[
                    styles.historyExercise,
                    { color: colors.textSecondary },
                  ]}
                >
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
                {!selectedPlan?.isActive && (
                  <Button
                    title="Set as Active"
                    onPress={() => {
                      if (selectedPlan) {
                        setActivePlan(selectedPlan.id);
                        setShowPlanDetailsModal(false);
                      }
                    }}
                  />
                )}
                <Button
                  title="Edit Plan"
                  variant="outline"
                  onPress={() => {
                    if (selectedPlan) {
                      startEditingPlan(selectedPlan);
                    }
                  }}
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
                />
                <Button
                  title="Delete Plan"
                  variant="outline"
                  onPress={() => {
                    if (selectedPlan) {
                      deletePlan(selectedPlan.id);
                    }
                  }}
                />
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  startWorkoutTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
  },
  startWorkoutSubtitle: {
    fontSize: 15,
    marginTop: 8,
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
    marginBottom: 16,
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
  setNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
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
});
