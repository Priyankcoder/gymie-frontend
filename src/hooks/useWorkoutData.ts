
/**
 * Custom hook for managing workout-related data
 * Centralizes data fetching for workouts, PRs, exercises, templates, and plans
 */

import { useState, useCallback } from 'react';
import { localApi } from '../services/localApi';
import {
  Workout,
  PersonalRecord,
  ExerciseInfo,
  WorkoutTemplate,
  WorkoutPlan,
  ScheduledWorkout,
  WorkoutPlanDay,
} from '../types';
import { useRefreshOnFocus } from './useRefreshOnFocus';

interface WorkoutData {
  workouts: Workout[];
  personalRecords: PersonalRecord[];
  exerciseList: ExerciseInfo[];
  templates: WorkoutTemplate[];
  workoutPlans: WorkoutPlan[];
  scheduledWorkouts: ScheduledWorkout[];
  todaysWorkout: {
    scheduled: ScheduledWorkout | null;
    plan: WorkoutPlan | null;
    day: WorkoutPlanDay | null;
  };
}

interface UseWorkoutDataResult extends WorkoutData {
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const initialData: WorkoutData = {
  workouts: [],
  personalRecords: [],
  exerciseList: [],
  templates: [],
  workoutPlans: [],
  scheduledWorkouts: [],
  todaysWorkout: { scheduled: null, plan: null, day: null },
};

export const useWorkoutData = (): UseWorkoutDataResult => {
  const [data, setData] = useState<WorkoutData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        workoutsRes,
        prsRes,
        exercisesRes,
        templatesRes,
        plansRes,
        scheduledRes,
        todayRes,
      ] = await Promise.all([
        localApi.workouts.getAll(),
        localApi.prs.getAll(),
        localApi.exercises.getAll(),
        localApi.templates.getAll(),
        localApi.workoutPlans.getAll(),
        localApi.scheduledWorkouts.getAll(),
        localApi.scheduledWorkouts.getTodaysWorkout(),
      ]);

      setData({
        workouts: workoutsRes.data
          ? workoutsRes.data.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          : [],
        personalRecords: prsRes.data || [],
        exerciseList: exercisesRes.data || [],
        templates: templatesRes.data || [],
        workoutPlans: plansRes.data || [],
        scheduledWorkouts: scheduledRes.data || [],
        todaysWorkout: todayRes.data || { scheduled: null, plan: null, day: null },
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load workout data'));
      console.error('Error loading workout data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically refetch when screen comes into focus
  useRefreshOnFocus(loadData);

  return {
    ...data,
    loading,
    error,
    refetch: loadData,
  };
};
