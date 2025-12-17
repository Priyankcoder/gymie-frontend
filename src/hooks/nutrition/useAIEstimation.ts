
import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { localApi } from '../../services/localApi';
import { MealEstimation, Meal } from '../../types';
import { getTodayString } from '../../utils/date';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface UseAIEstimationReturn {
  selectedImage: string | null;
  aiEstimation: MealEstimation | null;
  isEstimating: boolean;
  pickImage: () => Promise<void>;
  takePhoto: () => Promise<void>;
  saveMealFromAI: (mealType: MealType, onSuccess: () => void) => Promise<void>;
  clearEstimation: () => void;
}

export const useAIEstimation = (): UseAIEstimationReturn => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiEstimation, setAiEstimation] = useState<MealEstimation | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const today = getTodayString();

  const estimateMeal = async (imageUri: string) => {
    setIsEstimating(true);
    try {
      const response = await localApi.meals.estimateFromImage(imageUri);
      if (response.data) {
        setAiEstimation(response.data);
      }
    } catch (error) {
      console.error('Error estimating meal:', error);
      Alert.alert('Error', 'Failed to estimate meal. Please try again.');
    } finally {
      setIsEstimating(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      estimateMeal(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
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
      estimateMeal(result.assets[0].uri);
    }
  };

  const saveMealFromAI = async (mealType: MealType, onSuccess: () => void) => {
    if (!aiEstimation || !selectedImage) return;

    try {
      const newMeal: Omit<Meal, 'id'> = {
        name: 'AI Estimated Meal',
        calories: aiEstimation.calories,
        protein: aiEstimation.protein,
        carbs: aiEstimation.carbs,
        fat: aiEstimation.fat,
        imageUri: selectedImage,
        mealType,
        date: today,
        timestamp: Date.now(),
        isAiEstimated: true,
        confidence: aiEstimation.confidence,
      };

      await localApi.meals.create(newMeal);
      clearEstimation();
      onSuccess();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const clearEstimation = () => {
    setSelectedImage(null);
    setAiEstimation(null);
  };

  return {
    selectedImage,
    aiEstimation,
    isEstimating,
    pickImage,
    takePhoto,
    saveMealFromAI,
    clearEstimation,
  };
};
