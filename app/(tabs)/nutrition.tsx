
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, Button, MetricRing, MacroBar } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { Meal, MealEstimation, Recipe, UserPreferences } from '../../src/types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function NutritionScreen() {
  const { colors, spacing, borderRadius } = useTheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [selectedTab, setSelectedTab] = useState<'diary' | 'recipes'>('diary');
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAIEstimateModal, setShowAIEstimateModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiEstimation, setAiEstimation] = useState<MealEstimation | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState('');
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  // Manual meal input state
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [prefsRes, mealsRes] = await Promise.all([
      localApi.preferences.get(),
      localApi.meals.getByDate(today),
    ]);

    if (prefsRes.data) setPreferences(prefsRes.data);
    if (mealsRes.data) setTodayMeals(mealsRes.data);
  };

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

  const getMealsByType = (type: MealType) => todayMeals.filter((m) => m.mealType === type);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowAIEstimateModal(true);
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
      setShowAIEstimateModal(true);
      estimateMeal(result.assets[0].uri);
    }
  };

  const estimateMeal = async (imageUri: string) => {
    setIsEstimating(true);
    try {
      const response = await localApi.meals.estimateFromImage(imageUri);
      if (response.data) {
        setAiEstimation(response.data);
      }
    } catch (error) {
      console.error('Error estimating meal:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const saveMealFromAI = async () => {
    if (!aiEstimation || !selectedImage) return;

    const newMeal: Omit<Meal, 'id'> = {
      name: 'AI Estimated Meal',
      calories: aiEstimation.calories,
      protein: aiEstimation.protein,
      carbs: aiEstimation.carbs,
      fat: aiEstimation.fat,
      imageUri: selectedImage,
      mealType: selectedMealType,
      date: today,
      timestamp: Date.now(),
      isAiEstimated: true,
      confidence: aiEstimation.confidence,
    };

    await localApi.meals.create(newMeal);
    setShowAIEstimateModal(false);
    setSelectedImage(null);
    setAiEstimation(null);
    loadData();
  };

  const saveManualMeal = async () => {
    if (!mealName || !mealCalories) {
      Alert.alert('Required', 'Please enter meal name and calories');
      return;
    }

    const newMeal: Omit<Meal, 'id'> = {
      name: mealName,
      calories: parseInt(mealCalories) || 0,
      protein: parseInt(mealProtein) || 0,
      carbs: parseInt(mealCarbs) || 0,
      fat: parseInt(mealFat) || 0,
      mealType: selectedMealType,
      date: today,
      timestamp: Date.now(),
    };

    await localApi.meals.create(newMeal);
    setShowAddMealModal(false);
    resetMealForm();
    loadData();
  };

  const resetMealForm = () => {
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
  };

  const generateRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Required', 'Please enter some ingredients');
      return;
    }

    setIsGeneratingRecipes(true);
    try {
      const ingredientList = ingredients.split(',').map((i) => i.trim());
      const response = await localApi.recipes.generateFromIngredients(ingredientList);
      if (response.data) {
        setRecipes(response.data);
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const renderDiaryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Daily Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <MetricRing
            value={nutritionTotals.calories}
            maxValue={calorieGoal}
            size={100}
            strokeWidth={10}
            color={colors.caloriesRing}
            unit="kcal"
          />
          <View style={styles.summaryMacros}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.proteinColor }]}>
                {nutritionTotals.protein}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.carbsColor }]}>
                {nutritionTotals.carbs}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.fatColor }]}>
                {nutritionTotals.fat}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* AI Upload Card */}
      <Card style={styles.uploadCard}>
        <View style={styles.uploadContent}>
          <Ionicons name="camera" size={32} color={colors.accentBlue} />
          <View style={styles.uploadText}>
            <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>
              AI Meal Estimation
            </Text>
            <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
              Upload a photo to estimate macros
            </Text>
          </View>
        </View>
        <View style={styles.uploadButtons}>
          <Button title="Take Photo" variant="outline" size="sm" onPress={takePhoto} />
          <Button title="Upload" size="sm" onPress={pickImage} />
        </View>
      </Card>

      {/* Meal Sections */}
      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
        <Card key={mealType} style={styles.mealSection}>
          <View style={styles.mealSectionHeader}>
            <View style={styles.mealTypeInfo}>
              <Ionicons
                name={
                  mealType === 'breakfast'
                    ? 'sunny'
                    : mealType === 'lunch'
                    ? 'partly-sunny'
                    : mealType === 'dinner'
                    ? 'moon'
                    : 'cafe'
                }
                size={20}
                color={colors.accentBlue}
              />
              <Text style={[styles.mealTypeName, { color: colors.textPrimary }]}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setSelectedMealType(mealType);
                setShowAddMealModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={colors.accentBlue} />
            </Pressable>
          </View>
          {getMealsByType(mealType).length > 0 ? (
            getMealsByType(mealType).map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <View style={styles.mealItemInfo}>
                  <Text style={[styles.mealItemName, { color: colors.textPrimary }]}>
                    {meal.name}
                  </Text>
                  <Text style={[styles.mealItemMacros, { color: colors.textSecondary }]}>
                    P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                  </Text>
                </View>
                <Text style={[styles.mealItemCalories, { color: colors.accentBlue }]}>
                  {meal.calories} kcal
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyMealText, { color: colors.textSecondary }]}>
              No meals added
            </Text>
          )}
        </Card>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderRecipesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.recipeGeneratorCard}>
        <Text style={[styles.recipeGeneratorTitle, { color: colors.textPrimary }]}>
          Recipe Generator
        </Text>
        <Text style={[styles.recipeGeneratorSubtitle, { color: colors.textSecondary }]}>
          Enter ingredients to get recipe suggestions
        </Text>
        <TextInput
          style={[
            styles.ingredientInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderRadius: borderRadius.md,
            },
          ]}
          value={ingredients}
          onChangeText={setIngredients}
          placeholder="e.g., chicken, rice, broccoli"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <Button
          title="Generate Recipes"
          onPress={generateRecipes}
          loading={isGeneratingRecipes}
          style={{ marginTop: 12 }}
        />
      </Card>

      {recipes.length > 0 && (
        <Text style={[styles.recipesTitle, { color: colors.textPrimary }]}>
          Suggested Recipes
        </Text>
      )}

      {recipes.map((recipe) => (
        <Card key={recipe.id} style={styles.recipeCard}>
          <Text style={[styles.recipeName, { color: colors.textPrimary }]}>{recipe.name}</Text>
          <View style={styles.recipeMeta}>
            <View style={styles.recipeMetaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>
                {recipe.prepTime + recipe.cookTime} min
              </Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>
                {recipe.servings} servings
              </Text>
            </View>
          </View>
          <View style={styles.recipeMacros}>
            <Text style={[styles.recipeMacroText, { color: colors.proteinColor }]}>
              P: {recipe.protein}g
            </Text>
            <Text style={[styles.recipeMacroText, { color: colors.carbsColor }]}>
              C: {recipe.carbs}g
            </Text>
            <Text style={[styles.recipeMacroText, { color: colors.fatColor }]}>
              F: {recipe.fat}g
            </Text>
            <Text style={[styles.recipeMacroText, { color: colors.accentBlue }]}>
              {recipe.calories} kcal
            </Text>
          </View>
          <Text style={[styles.recipeIngredients, { color: colors.textSecondary }]}>
            {recipe.ingredients.join(', ')}
          </Text>
        </Card>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Nutrition</Text>
      </View>

      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['diary', 'recipes'] as const).map((tab) => (
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
              {tab === 'diary' ? 'Food Diary' : 'Recipes'}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedTab === 'diary' && renderDiaryTab()}
      {selectedTab === 'recipes' && renderRecipesTab()}

      {/* Add Meal Modal */}
      <Modal visible={showAddMealModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Add {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
              </Text>
              <Pressable onPress={() => setShowAddMealModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                value={mealName}
                onChangeText={setMealName}
                placeholder="Meal name"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.macroInputRow}>
                <TextInput
                  style={[styles.macroInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={mealCalories}
                  onChangeText={setMealCalories}
                  placeholder="Calories"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.macroInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={mealProtein}
                  onChangeText={setMealProtein}
                  placeholder="Protein (g)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={[styles.macroInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={mealCarbs}
                  onChangeText={setMealCarbs}
                  placeholder="Carbs (g)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.macroInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={mealFat}
                  onChangeText={setMealFat}
                  placeholder="Fat (g)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <Button title="Add Meal" onPress={saveManualMeal} style={{ marginTop: 16 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Estimation Modal */}
      <Modal visible={showAIEstimateModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>AI Estimation</Text>
              <Pressable
                onPress={() => {
                  setShowAIEstimateModal(false);
                  setSelectedImage(null);
                  setAiEstimation(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            )}

            {isEstimating ? (
              <View style={styles.estimatingContainer}>
                <Ionicons name="sparkles" size={40} color={colors.accentBlue} />
                <Text style={[styles.estimatingText, { color: colors.textPrimary }]}>
                  Analyzing your meal...
                </Text>
              </View>
            ) : aiEstimation ? (
              <View style={styles.estimationResult}>
                <View style={styles.confidenceBadge}>
                  <Text style={[styles.confidenceText, { color: colors.success }]}>
                    {Math.round(aiEstimation.confidence * 100)}% confidence
                  </Text>
                </View>
                <View style={styles.estimationMacros}>
                  <View style={styles.estimationMacro}>
                    <Text style={[styles.estimationValue, { color: colors.textPrimary }]}>
                      {aiEstimation.calories}
                    </Text>
                    <Text style={[styles.estimationLabel, { color: colors.textSecondary }]}>
                      kcal
                    </Text>
                  </View>
                  <View style={styles.estimationMacro}>
                    <Text style={[styles.estimationValue, { color: colors.proteinColor }]}>
                      {aiEstimation.protein}g
                    </Text>
                    <Text style={[styles.estimationLabel, { color: colors.textSecondary }]}>
                      Protein
                    </Text>
                  </View>
                  <View style={styles.estimationMacro}>
                    <Text style={[styles.estimationValue, { color: colors.carbsColor }]}>
                      {aiEstimation.carbs}g
                    </Text>
                    <Text style={[styles.estimationLabel, { color: colors.textSecondary }]}>
                      Carbs
                    </Text>
                  </View>
                  <View style={styles.estimationMacro}>
                    <Text style={[styles.estimationValue, { color: colors.fatColor }]}>
                      {aiEstimation.fat}g
                    </Text>
                    <Text style={[styles.estimationLabel, { color: colors.textSecondary }]}>
                      Fat
                    </Text>
                  </View>
                </View>
                <View style={styles.mealTypeSelector}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.mealTypeOption,
                        {
                          backgroundColor:
                            selectedMealType === type ? colors.accentBlue : colors.inputBackground,
                        },
                      ]}
                      onPress={() => setSelectedMealType(type)}
                    >
                      <Text
                        style={[
                          styles.mealTypeOptionText,
                          { color: selectedMealType === type ? '#FFF' : colors.textSecondary },
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button title="Add to Diary" onPress={saveMealFromAI} style={{ marginTop: 16 }} />
              </View>
            ) : null}
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
    paddingTop: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryMacros: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  uploadCard: {
    marginBottom: 16,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  mealItemMacros: {
    fontSize: 12,
    marginTop: 2,
  },
  mealItemCalories: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyMealText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  recipeGeneratorCard: {
    marginBottom: 16,
  },
  recipeGeneratorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeGeneratorSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  ingredientInput: {
    height: 80,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  recipesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recipeCard: {
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  recipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 13,
  },
  recipeMacros: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  recipeMacroText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recipeIngredients: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  modalBody: {
    padding: 16,
  },
  modalInput: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  estimatingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  estimatingText: {
    fontSize: 16,
    marginTop: 16,
  },
  estimationResult: {
    padding: 16,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginBottom: 16,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  estimationMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  estimationMacro: {
    alignItems: 'center',
  },
  estimationValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  estimationLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mealTypeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mealTypeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
