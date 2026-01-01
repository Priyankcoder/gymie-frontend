/**
 * Hook for offline nutrition estimation
 * Replaces the mock AI estimation with real offline-first system
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import offlineNutritionService from '../../services/OfflineNutritionService';
import { DishSearchResult, PortionSize } from '../../services/nutritionDatabase';
import { api } from '../../services/api';
import { Meal } from '../../types';
import { getTodayString } from '../../utils/date';

// TODO: Update types when OfflineNutritionService interface is finalized
interface NutritionEstimation {
  dishName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  imageHash?: string;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface UseOfflineNutritionReturn {
  // Image handling
  selectedImage: string | null;
  pickImage: () => Promise<void>;
  takePhoto: () => Promise<void>;
  
  // Dish selection
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: DishSearchResult[];
  allDishes: DishSearchResult[];
  
  // Portion selection
  selectedDish: DishSearchResult | null;
  selectedPortion: PortionSize;
  setSelectedDish: (dish: DishSearchResult | null) => void;
  setSelectedPortion: (portion: PortionSize) => void;
  
  // Nutrition estimation
  nutritionEstimation: NutritionEstimation | null;
  isEstimating: boolean;
  estimateNutrition: () => Promise<void>;
  
  // Save meal
  saveMeal: (mealType: MealType, onSuccess: () => void) => Promise<void>;
  
  // Reset
  reset: () => void;
  
  // Stats
  stats: { totalDishes: number; unsyncedCorrections: number } | null;
}

export const useOfflineNutrition = (): UseOfflineNutritionReturn => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DishSearchResult[]>([]);
  const [allDishes, setAllDishes] = useState<DishSearchResult[]>([]);
  const [selectedDish, setSelectedDish] = useState<DishSearchResult | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<PortionSize>('medium');
  const [nutritionEstimation, setNutritionEstimation] = useState<NutritionEstimation | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [stats, setStats] = useState<{ totalDishes: number; unsyncedCorrections: number } | null>(null);

  const today = getTodayString();

  // Initialize service and load all dishes
  useEffect(() => {
    loadInitialData();
  }, []);

  // Search dishes when query changes
  useEffect(() => {
    searchDishes();
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      await offlineNutritionService.initialize();
      const dishes = await offlineNutritionService.getAllDishes();
      setAllDishes(dishes);
      setSearchResults(dishes);
      
      const statistics = await offlineNutritionService.getStatistics();
      setStats(statistics);
      
      console.log(`[OfflineNutrition] Loaded ${dishes.length} dishes`);
    } catch (error) {
      console.error('[OfflineNutrition] Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load nutrition database');
    }
  };

  const searchDishes = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(allDishes);
      return;
    }

    setIsSearching(true);
    try {
      const results = await offlineNutritionService.searchDishes(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('[OfflineNutrition] Error searching dishes:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const recognizeFoodFromImage = async (imageUri: string) => {
    setIsEstimating(true);
    try {
      console.log('[OfflineNutrition] Starting food recognition...');
      const result = await offlineNutritionService.recognizeFood(imageUri);
      
      setImageHash(result.imageHash);
      
      if (result.success && result.nutrition) {
        console.log('[OfflineNutrition] Food recognized:', {
          dish: result.prediction.dishName,
          confidence: result.prediction.confidence.toFixed(2),
          portion: result.portionEstimate.portion,
        });

        // Auto-select the recognized dish
        const recognizedDish: DishSearchResult = {
          dish_id: result.nutrition.dish.dish_id,
          display_name: result.nutrition.dish.display_name,
          category: result.nutrition.dish.category,
          cuisine: result.nutrition.dish.cuisine,
        };
        setSelectedDish(recognizedDish);
        setSelectedPortion(result.portionEstimate.portion);

        // Auto-populate nutrition estimation
        setNutritionEstimation({
          dishName: result.nutrition.dish.display_name,
          calories: result.nutrition.adjusted_nutrition.calories,
          protein: result.nutrition.adjusted_nutrition.protein,
          carbs: result.nutrition.adjusted_nutrition.carbs,
          fat: result.nutrition.adjusted_nutrition.fat,
          confidence: result.prediction.confidence,
          imageHash: result.imageHash,
        });

        // If confidence is high, show success message
        if (result.prediction.confidence >= 0.7) {
          Alert.alert(
            'Food Recognized!',
            `Detected: ${result.prediction.dishName}\nConfidence: ${(result.prediction.confidence * 100).toFixed(0)}%`,
            [{ text: 'OK' }]
          );
        } else {
          // Low confidence - suggest manual review
          Alert.alert(
            'Low Confidence Detection',
            `Detected: ${result.prediction.dishName}\nConfidence: ${(result.prediction.confidence * 100).toFixed(0)}%\n\nPlease verify or search for the correct dish.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // ML failed, fall back to manual selection
        console.warn('[OfflineNutrition] ML inference failed, showing manual selection');
        Alert.alert(
          'Manual Selection Required',
          result.error || 'Could not recognize food automatically. Please search and select manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[OfflineNutrition] Error during food recognition:', error);
      Alert.alert(
        'Recognition Error',
        'Could not recognize food automatically. Please search and select manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Automatically recognize food using ML
        console.log('[OfflineNutrition] Image selected, running ML inference...');
        await recognizeFoodFromImage(imageUri);
      }
    } catch (error) {
      console.error('[OfflineNutrition] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        
        // Get image hash for correction tracking
        const estimation = await offlineNutritionService.estimateFromImage(result.assets[0].uri);
        setImageHash(estimation.imageHash);
        
        console.log('[OfflineNutrition] Photo taken, manual selection required');
      }
    } catch (error) {
      console.error('[OfflineNutrition] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const estimateNutrition = async () => {
    if (!selectedDish) {
      Alert.alert('No Dish Selected', 'Please select a dish first');
      return;
    }

    setIsEstimating(true);
    try {
      const estimation = await offlineNutritionService.getNutritionForDish(
        selectedDish.dish_id,
        selectedPortion,
        imageHash || undefined
      );

      if (estimation) {
        setNutritionEstimation(estimation);
        console.log('[OfflineNutrition] Nutrition estimated:', estimation);
      } else {
        Alert.alert('Error', 'Failed to get nutrition data for selected dish');
      }
    } catch (error) {
      console.error('[OfflineNutrition] Error estimating nutrition:', error);
      Alert.alert('Error', 'Failed to estimate nutrition');
    } finally {
      setIsEstimating(false);
    }
  };

  const saveMeal = async (mealType: MealType, onSuccess: () => void) => {
    if (!nutritionEstimation) {
      Alert.alert('Error', 'No nutrition estimation available');
      return;
    }

    try {
      const newMeal: Omit<Meal, 'id'> = {
        name: nutritionEstimation.dishName,
        calories: nutritionEstimation.calories,
        protein: nutritionEstimation.protein,
        carbs: nutritionEstimation.carbs,
        fat: nutritionEstimation.fat,
        imageUri: selectedImage || undefined,
        mealType,
        date: today,
        timestamp: Date.now(),
        isAiEstimated: true,
        confidence: nutritionEstimation.confidence,
      };

      await api.meals.create(newMeal);
      
      console.log('[OfflineNutrition] Meal saved successfully');
      reset();
      onSuccess();
    } catch (error) {
      console.error('[OfflineNutrition] Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setImageHash(null);
    setSelectedDish(null);
    setSelectedPortion('medium');
    setNutritionEstimation(null);
    setSearchQuery('');
  };

  return {
    selectedImage,
    pickImage,
    takePhoto,
    isSearching,
    searchQuery,
    setSearchQuery,
    searchResults,
    allDishes,
    selectedDish,
    selectedPortion,
    setSelectedDish,
    setSelectedPortion,
    nutritionEstimation,
    isEstimating,
    estimateNutrition,
    saveMeal,
    reset,
    stats,
  };
};
