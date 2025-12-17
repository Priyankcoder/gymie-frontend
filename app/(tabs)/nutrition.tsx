
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useNutritionData } from '../../src/hooks/nutrition/useNutritionData';
import { useAIEstimation } from '../../src/hooks/nutrition/useAIEstimation';
import {
  NutritionSummaryCard,
  AIUploadCard,
  MealTypeSection,
} from '../../src/components/features/nutrition/components';
import {
  AIEstimationModal,
  AddMealModal,
  RecipeGeneratorModal,
} from '../../src/components/features/nutrition/modals';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const {
    nutritionTotals,
    calorieGoal,
    getMealsByType,
    refetch,
  } = useNutritionData();

  const {
    selectedImage,
    aiEstimation,
    isEstimating,
    pickImage,
    takePhoto,
    saveMealFromAI,
    clearEstimation,
  } = useAIEstimation();

  const [selectedTab, setSelectedTab] = useState<'diary' | 'recipes'>('diary');
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAIEstimateModal, setShowAIEstimateModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

  const handlePickImage = async () => {
    await pickImage();
    setShowAIEstimateModal(true);
  };

  const handleTakePhoto = async () => {
    await takePhoto();
    setShowAIEstimateModal(true);
  };

  const handleSaveMealFromAI = async () => {
    await saveMealFromAI(selectedMealType, () => {
      setShowAIEstimateModal(false);
      refetch();
    });
  };

  const handleCloseAIModal = () => {
    setShowAIEstimateModal(false);
    clearEstimation();
  };

  const handleAddMealSuccess = () => {
    refetch();
  };

  const handleOpenAddMeal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowAddMealModal(true);
  };

  const renderDiaryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <NutritionSummaryCard
        calories={nutritionTotals.calories}
        protein={nutritionTotals.protein}
        carbs={nutritionTotals.carbs}
        fat={nutritionTotals.fat}
        calorieGoal={calorieGoal}
      />

      <AIUploadCard onTakePhoto={handleTakePhoto} onPickPhoto={handlePickImage} />

      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
        <MealTypeSection
          key={mealType}
          mealType={mealType}
          meals={getMealsByType(mealType)}
          onAddMeal={() => handleOpenAddMeal(mealType)}
        />
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderRecipesTab = () => (
    <View style={styles.tabContent}>
      <RecipeGeneratorModal />
    </View>
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

      <AddMealModal
        visible={showAddMealModal}
        mealType={selectedMealType}
        onClose={() => setShowAddMealModal(false)}
        onSuccess={handleAddMealSuccess}
      />

      <AIEstimationModal
        visible={showAIEstimateModal}
        selectedImage={selectedImage}
        aiEstimation={aiEstimation}
        isEstimating={isEstimating}
        selectedMealType={selectedMealType}
        onClose={handleCloseAIModal}
        onSave={handleSaveMealFromAI}
        onSelectMealType={setSelectedMealType}
      />
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
});
