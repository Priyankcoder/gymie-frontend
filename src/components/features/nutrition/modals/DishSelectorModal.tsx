/**
 * Dish Selector Modal
 * Allows users to manually select a dish and portion size for offline nutrition tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAppData } from '../../../../contexts/AppDataContext';
import { DishSearchResult, PortionSize } from '../../../../services/nutritionDatabase';

// TODO: Update when OfflineNutritionService interface is finalized
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

interface DishSelectorModalProps {
  visible: boolean;
  selectedImage: string | null;
  searchQuery: string;
  searchResults: DishSearchResult[];
  isSearching: boolean;
  selectedDish: DishSearchResult | null;
  selectedPortion: PortionSize;
  nutritionEstimation: NutritionEstimation | null;
  isEstimating: boolean;
  onSearchChange: (query: string) => void;
  onSelectDish: (dish: DishSearchResult) => void;
  onSelectPortion: (portion: PortionSize) => void;
  onEstimate: () => void;
  onSave: (mealType: MealType, editedNutrition?: { calories: number; protein: number; carbs: number; fat: number; portionGrams: number }) => void;
  onClose: () => void;
}

export const DishSelectorModal: React.FC<DishSelectorModalProps> = ({
  visible,
  selectedImage,
  searchQuery,
  searchResults,
  isSearching,
  selectedDish,
  selectedPortion,
  nutritionEstimation,
  isEstimating,
  onSearchChange,
  onSelectDish,
  onSelectPortion,
  onEstimate,
  onSave,
  onClose,
}) => {
  const { colors } = useTheme();
  const { preferences } = useAppData();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  
  // Portion size in grams (small: 100g, medium: 150g, large: 200g)
  const PORTION_GRAMS = { small: 100, medium: 150, large: 200 };
  const [portionGrams, setPortionGrams] = useState(PORTION_GRAMS.medium);
  const [sliderValue, setSliderValue] = useState(1); // 0=small, 1=medium, 2=large
  
  // Editable nutrition values
  const [editedCalories, setEditedCalories] = useState('');
  const [editedProtein, setEditedProtein] = useState('');
  const [editedCarbs, setEditedCarbs] = useState('');
  const [editedFat, setEditedFat] = useState('');
  
  // Unit preference (default to 'g' for grams)
  const weightUnit = preferences?.units === 'lb' ? 'oz' : 'g';
  
  // Initialize editable values when nutrition estimation changes
  useEffect(() => {
    if (nutritionEstimation) {
      setEditedCalories(Math.round(nutritionEstimation.calories).toString());
      setEditedProtein(nutritionEstimation.protein.toFixed(2));
      setEditedCarbs(nutritionEstimation.carbs.toFixed(2));
      setEditedFat(nutritionEstimation.fat.toFixed(2));
    }
  }, [nutritionEstimation]);
  
  // Update portion when slider changes
  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setSliderValue(roundedValue);
    
    let newPortion: PortionSize;
    let grams: number;
    
    if (roundedValue === 0) {
      newPortion = 'small';
      grams = PORTION_GRAMS.small;
    } else if (roundedValue === 2) {
      newPortion = 'large';
      grams = PORTION_GRAMS.large;
    } else {
      newPortion = 'medium';
      grams = PORTION_GRAMS.medium;
    }
    
    setPortionGrams(grams);
    onSelectPortion(newPortion);
  };
  
  // Get portion label
  const getPortionLabel = () => {
    if (sliderValue <= 0.5) return 'Small';
    if (sliderValue >= 1.5) return 'Large';
    return 'Medium';
  };
  
  // Convert grams to ounces if needed
  const convertWeight = (grams: number): string => {
    if (weightUnit === 'oz') {
      const oz = (grams * 0.035274).toFixed(1);
      return `${oz} oz`;
    }
    return `${grams}g`;
  };

  const renderDishItem = ({ item }: { item: DishSearchResult }) => (
    <Pressable
      style={[
        styles.dishItem,
        {
          backgroundColor: colors.card,
          borderColor: selectedDish?.dish_id === item.dish_id ? colors.accentBlue : colors.border,
          borderWidth: selectedDish?.dish_id === item.dish_id ? 2 : 1,
        },
      ]}
      onPress={() => onSelectDish(item)}
    >
      <View style={styles.dishInfo}>
        <Text style={[styles.dishName, { color: colors.textPrimary }]}>
          {item.display_name}
        </Text>
        <View style={styles.dishMeta}>
          <Text style={[styles.dishCategory, { color: colors.textSecondary }]}>
            {item.category || 'other'}
          </Text>
          <Text style={[styles.dishCuisine, { color: colors.textSecondary }]}>
            • {item.cuisine || 'international'}
          </Text>
        </View>
      </View>
      {selectedDish?.dish_id === item.dish_id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
      )}
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {nutritionEstimation ? 'Nutrition Details' : 'Select Dish'}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Image Preview */}
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}

          {!nutritionEstimation ? (
            <>
              {/* Search Input */}
              <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search dishes..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={onSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Dish List */}
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.accentBlue} />
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderDishItem}
                  keyExtractor={(item) => item.dish_id}
                  style={styles.dishList}
                  contentContainerStyle={styles.dishListContent}
                  ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No dishes found
                    </Text>
                  }
                />
              )}

              {/* Portion Selector */}
              {selectedDish && (
                <View style={styles.portionContainer}>
                  <Text style={[styles.portionLabel, { color: colors.textPrimary }]}>
                    Select Portion Size:
                  </Text>
                  <View style={styles.portionButtons}>
                    {(['small', 'medium', 'large'] as PortionSize[]).map((size) => (
                      <Pressable
                        key={size}
                        style={[
                          styles.portionButton,
                          {
                            backgroundColor:
                              selectedPortion === size ? colors.accentBlue : colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => onSelectPortion(size)}
                      >
                        <Text
                          style={[
                            styles.portionButtonText,
                            {
                              color:
                                selectedPortion === size ? '#FFFFFF' : colors.textPrimary,
                            },
                          ]}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </Text>
                        <Text
                          style={[
                            styles.portionMultiplier,
                            {
                              color:
                                selectedPortion === size ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {size === 'small' && '0.75x'}
                          {size === 'medium' && '1.0x'}
                          {size === 'large' && '1.3x'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Estimate Button */}
              <Button
                title={isEstimating ? 'Calculating...' : 'Calculate Nutrition'}
                onPress={onEstimate}
                disabled={!selectedDish || isEstimating}
                style={styles.estimateButton}
              />
            </>
          ) : (
            <>
              {/* Nutrition Results */}
              <View style={styles.nutritionContainer}>
                {/* Confidence Badge */}
                {nutritionEstimation.confidence !== undefined && (
                  <View style={[
                    styles.confidenceBadge,
                    { backgroundColor: nutritionEstimation.confidence >= 0.7
                      ? colors.success + '20'
                      : nutritionEstimation.confidence >= 0.5
                        ? colors.warning + '20'
                        : colors.error + '20'
                    }
                  ]}>
                    <Ionicons
                      name={nutritionEstimation.confidence >= 0.7 ? "checkmark-circle" : "information-circle"}
                      size={20}
                      color={nutritionEstimation.confidence >= 0.7
                        ? colors.success
                        : nutritionEstimation.confidence >= 0.5
                          ? colors.warning
                          : colors.error
                      }
                    />
                    <Text style={[
                      styles.confidenceText,
                      { color: nutritionEstimation.confidence >= 0.7
                        ? colors.success
                        : nutritionEstimation.confidence >= 0.5
                          ? colors.warning
                          : colors.error
                      }
                    ]}>
                      {(nutritionEstimation.confidence * 100).toFixed(0)}% Confidence
                    </Text>
                  </View>
                )}

                <Text style={[styles.dishNameLarge, { color: colors.textPrimary }]}>
                  {nutritionEstimation.dishName}
                </Text>

                {/* Portion Size Selector with Weight */}
                <View style={styles.portionSliderContainer}>
                  <View style={styles.portionSliderHeader}>
                    <Text style={[styles.portionLabel, { color: colors.textPrimary }]}>
                      Portion Size
                    </Text>
                    <Text style={[styles.portionValue, { color: colors.accentBlue }]}>
                      {getPortionLabel()} ({convertWeight(portionGrams)})
                    </Text>
                  </View>
                  
                  {/* Custom Slider-like Interface */}
                  <View style={styles.portionSliderTrack}>
                    <View style={[styles.sliderTrackBackground, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.sliderTrackFill,
                          {
                            backgroundColor: colors.accentBlue,
                            width: `${(sliderValue / 2) * 100}%`
                          }
                        ]}
                      />
                    </View>
                    
                    {/* Slider Buttons */}
                    <View style={styles.sliderButtons}>
                      {[
                        { value: 0, label: 'Small', grams: PORTION_GRAMS.small },
                        { value: 1, label: 'Medium', grams: PORTION_GRAMS.medium },
                        { value: 2, label: 'Large', grams: PORTION_GRAMS.large },
                      ].map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.sliderButton,
                            {
                              backgroundColor: sliderValue === option.value
                                ? colors.accentBlue
                                : colors.card,
                              borderColor: sliderValue === option.value
                                ? colors.accentBlue
                                : colors.border,
                            },
                          ]}
                          onPress={() => {
                            setSliderValue(option.value);
                            setPortionGrams(option.grams);
                            onSelectPortion(option.label.toLowerCase() as PortionSize);
                          }}
                        >
                          <Text
                            style={[
                              styles.sliderButtonText,
                              { color: sliderValue === option.value ? '#FFFFFF' : colors.textPrimary },
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.sliderButtonGrams,
                              { color: sliderValue === option.value ? '#FFFFFF' : colors.textSecondary },
                            ]}
                          >
                            {convertWeight(option.grams)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Editable Macros Grid */}
                <View style={styles.macrosEditGrid}>
                  <View style={styles.macroEditItem}>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Calories
                    </Text>
                    <TextInput
                      style={[
                        styles.macroInput,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={editedCalories}
                      onChangeText={setEditedCalories}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      kcal
                    </Text>
                  </View>
                  
                  <View style={styles.macroEditItem}>
                    <Text style={[styles.macroLabel, { color: colors.proteinColor }]}>
                      Protein
                    </Text>
                    <TextInput
                      style={[
                        styles.macroInput,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.proteinColor,
                        },
                      ]}
                      value={editedProtein}
                      onChangeText={setEditedProtein}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>
                  
                  <View style={styles.macroEditItem}>
                    <Text style={[styles.macroLabel, { color: colors.carbsColor }]}>
                      Carbs
                    </Text>
                    <TextInput
                      style={[
                        styles.macroInput,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.carbsColor,
                        },
                      ]}
                      value={editedCarbs}
                      onChangeText={setEditedCarbs}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>
                  
                  <View style={styles.macroEditItem}>
                    <Text style={[styles.macroLabel, { color: colors.fatColor }]}>
                      Fat
                    </Text>
                    <TextInput
                      style={[
                        styles.macroInput,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.fatColor,
                        },
                      ]}
                      value={editedFat}
                      onChangeText={setEditedFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={[styles.macroUnit, { color: colors.textSecondary }]}>
                      g
                    </Text>
                  </View>
                </View>
              </View>

              {/* Meal Type Selector */}
              <View style={styles.mealTypeContainer}>
                <Text style={[styles.mealTypeLabel, { color: colors.textPrimary }]}>
                  Save as:
                </Text>
                <View style={styles.mealTypeButtons}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        {
                          backgroundColor:
                            selectedMealType === type ? colors.accentBlue : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSelectedMealType(type)}
                    >
                      <Text
                        style={[
                          styles.mealTypeButtonText,
                          {
                            color:
                              selectedMealType === type ? '#FFFFFF' : colors.textPrimary,
                          },
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <Button
                title="Save Meal"
                onPress={() => {
                  const editedNutrition = {
                    calories: parseFloat(editedCalories) || 0,
                    protein: parseFloat(editedProtein) || 0,
                    carbs: parseFloat(editedCarbs) || 0,
                    fat: parseFloat(editedFat) || 0,
                    portionGrams,
                  };
                  onSave(selectedMealType, editedNutrition);
                }}
                style={styles.saveButton}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishList: {
    flex: 1,
  },
  dishListContent: {
    paddingBottom: 16,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishCategory: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  dishCuisine: {
    fontSize: 14,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
  },
  portionContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  portionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  portionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  portionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  portionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  portionMultiplier: {
    fontSize: 12,
  },
  estimateButton: {
    marginTop: 8,
  },
  nutritionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dishNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  portionText: {
    fontSize: 16,
    marginBottom: 24,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  macroItem: {
    alignItems: 'center',
    minWidth: '20%',
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
  },
  mealTypeContainer: {
    marginBottom: 16,
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  mealTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 8,
  },
  portionSliderContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 24,
  },
  portionSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  portionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  portionSliderTrack: {
    width: '100%',
  },
  sliderTrackBackground: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sliderButtonGrams: {
    fontSize: 12,
  },
  macrosEditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  macroEditItem: {
    alignItems: 'center',
    minWidth: '40%',
  },
  macroInput: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 80,
  },
  macroUnit: {
    fontSize: 12,
    marginTop: 2,
  },
});
