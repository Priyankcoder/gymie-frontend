import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../../services/api";
import {
  Workout,
  WeightLog,
  ExerciseInfo,
  UserPreferences,
  ProgressPhoto,
} from "../../types";

type DateRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface ExerciseStats {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  max1RM: number;
  totalSessions: number;
  lastPerformed: string | null;
  trend: "up" | "down" | "stable";
}

interface UseProgressDataReturn {
  workouts: Workout[];
  weightLogs: WeightLog[];
  exercises: ExerciseInfo[];
  preferences: UserPreferences | null;
  progressPhotos: ProgressPhoto[];
  uniqueExercises: { name: string; count: number; lastDate: string }[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getDateFilter: (range: DateRange) => Date;
  calculate1RM: (weight: number, reps: number) => number;
  getExerciseStats: (
    exerciseName: string,
    range: DateRange
  ) => ExerciseStats | null;
}

export const useProgressData = (): UseProgressDataReturn => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Progress: Loading data...');
      const [workoutsRes, weightRes, exercisesRes, prefsRes, photosRes] =
        await Promise.all([
          api.workouts.getAll(),
          api.weightLogs.getAll(),
          api.exercises.getAll(),
          api.preferences.get(),
          api.photos.getAll(),
        ]);

      console.log('📊 Progress: Workouts response:', workoutsRes);
      console.log('📊 Progress: Is array?', Array.isArray(workoutsRes));

      // Handle workouts (can be array or wrapped in .data)
      if (Array.isArray(workoutsRes)) {
        console.log('✅ Progress: Setting workouts:', workoutsRes.length);
        setWorkouts(workoutsRes);
      } else if (workoutsRes?.data) {
        console.log('✅ Progress: Setting workouts from .data:', workoutsRes.data.length);
        setWorkouts(workoutsRes.data);
      }

      // Handle weight logs
      if (Array.isArray(weightRes)) {
        const sorted = [...weightRes].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWeightLogs(sorted);
      } else if (weightRes?.data) {
        const sorted = [...weightRes.data].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWeightLogs(sorted);
      }

      // Handle exercises
      if (Array.isArray(exercisesRes)) {
        setExercises(exercisesRes);
      } else if (exercisesRes?.data) {
        setExercises(exercisesRes.data);
      }

      // Handle preferences
      if (prefsRes && !Array.isArray(prefsRes)) {
        setPreferences(prefsRes.data || prefsRes);
      }

      // Handle photos
      if (Array.isArray(photosRes)) {
        setProgressPhotos(photosRes);
      } else if (photosRes?.data) {
        setProgressPhotos(photosRes.data);
      }

      console.log('✅ Progress: Data loaded successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load progress data"
      );
      console.error("❌ Progress: Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get unique exercises from workout history
  const uniqueExercises = useMemo(() => {
    const exerciseMap = new Map<
      string,
      { name: string; count: number; lastDate: string }
    >();

    // Only include completed workouts with exercises
    workouts
      .filter((workout) => workout.completed && workout.exercises?.length > 0)
      .forEach((workout) => {
        workout.exercises.forEach((ex) => {
          // Only count exercises that have at least one set with actual data
          const hasValidSets = ex.sets && ex.sets.length > 0 &&
            ex.sets.some(set => (set.weight && set.weight > 0) || (set.reps && set.reps > 0));
          
          if (!hasValidSets) return;

          const existing = exerciseMap.get(ex.name);
          if (existing) {
            existing.count++;
            if (workout.date > existing.lastDate) {
              existing.lastDate = workout.date;
            }
          } else {
            exerciseMap.set(ex.name, {
              name: ex.name,
              count: 1,
              lastDate: workout.date,
            });
          }
        });
      });

    return Array.from(exerciseMap.values()).sort((a, b) => b.count - a.count);
  }, [workouts]);

  // Calculate date filter
  const getDateFilter = useCallback((range: DateRange): Date => {
    const now = new Date();
    switch (range) {
      case "1W":
        return new Date(now.setDate(now.getDate() - 7));
      case "1M":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3M":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6M":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1Y":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "ALL":
        return new Date(0);
    }
  }, []);

  // Calculate 1RM using Epley formula
  const calculate1RM = useCallback((weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }, []);

  // Get exercise stats
  const getExerciseStats = useCallback(
    (exerciseName: string, range: DateRange): ExerciseStats | null => {
      if (!exerciseName) return null;

      const filterDate = getDateFilter(range);
      let maxWeight = 0;
      let maxReps = 0;
      let maxVolume = 0;
      let max1RM = 0;
      let totalSessions = 0;
      let lastPerformed: string | null = null;
      const values: number[] = [];

      workouts
        .filter((w) => new Date(w.date) >= filterDate)
        .forEach((workout) => {
          const exercise = workout.exercises.find(
            (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
          );

          if (exercise) {
            const completedSets = exercise.sets.filter((s) => s.completed);
            if (completedSets.length === 0) return;

            totalSessions++;
            if (!lastPerformed || workout.date > lastPerformed) {
              lastPerformed = workout.date;
            }

            completedSets.forEach((set) => {
              maxWeight = Math.max(maxWeight, set.weight);
              maxReps = Math.max(maxReps, set.reps);
              const volume = set.weight * set.reps;
              maxVolume = Math.max(maxVolume, volume);
              const oneRM = calculate1RM(set.weight, set.reps);
              max1RM = Math.max(max1RM, oneRM);
            });

            // Track max weight for trend
            values.push(Math.max(...completedSets.map((s) => s.weight)));
          }
        });

      // Calculate trend
      let trend: "up" | "down" | "stable" = "stable";
      if (values.length >= 3) {
        const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        if (recentAvg > olderAvg * 1.05) trend = "up";
        else if (recentAvg < olderAvg * 0.95) trend = "down";
      }

      return {
        maxWeight,
        maxReps,
        maxVolume,
        max1RM,
        totalSessions,
        lastPerformed,
        trend,
      };
    },
    [workouts, getDateFilter, calculate1RM]
  );

  return {
    workouts,
    weightLogs,
    exercises,
    preferences,
    progressPhotos,
    uniqueExercises,
    loading,
    error,
    refetch: loadData,
    getDateFilter,
    calculate1RM,
    getExerciseStats,
  };
};
