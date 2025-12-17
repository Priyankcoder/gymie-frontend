
import { useState, useEffect } from 'react';
import { localApi } from '../../services/localApi';
import { Meal, UserPreferences } from '../../types';
import { getTodayString } from '../../utils/date';

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UseNutritionDataReturn {
  preferences: UserPreferences | null;
  todayMeals: Meal[];
  nutritionTotals: NutritionTotals;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getMealsByType: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => Meal[];
}

export const useNutritionData = (): UseNutritionDataReturn => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayString();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [prefsRes, mealsRes] = await Promise.all([
        localApi.preferences.get(),
        localApi.meals.getByDate(today),
      ]);

      if (prefsRes.data) setPreferences(prefsRes.data);
      if (mealsRes.data) setTodayMeals(mealsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nutrition data');
      console.error('Error loading nutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const getMealsByType = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') =>
    todayMeals.filter((m) => m.mealType === type);

  return {
    preferences,
    todayMeals,
    nutritionTotals,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    loading,
    error,
    refetch: loadData,
    getMealsByType,
  };
};
