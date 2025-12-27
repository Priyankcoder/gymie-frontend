/**
 * Dish Selector Modal
 * Allows users to manually select a dish and portion size for offline nutrition tracking
 */

import React, { useState } from 'react';
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
import { DishSearchResult, PortionSize } from '../../../../services/nutritionDatabase';
import { NutritionEstimation } from '../../../../services/offlineNutritionService';

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
  onSave: (mealType: MealType) => void;
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
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

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
            {item.category}
          </Text>
          <Text style={[styles.dishCuisine, { color: colors.textSecondary }]}>
            • {item.cuisine}
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
                <View style={[styles.confidenceBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.confidenceText, { color: colors.success }]}>
                    Manual Selection
                  </Text>
                </View>

                <Text style={[styles.dishNameLarge, { color: colors.textPrimary }]}>
                  {nutritionEstimation.dishName}
                </Text>
                
                <Text style={[styles.portionText, { color: colors.textSecondary }]}>
                  {nutritionEstimation.portion.charAt(0).toUpperCase() + nutritionEstimation.portion.slice(1)} Portion
                </Text>

                <View style={styles.macrosGrid}>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.textPrimary }]}>
                      {nutritionEstimation.calories}
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      kcal
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.proteinColor }]}>
                      {nutritionEstimation.protein}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Protein
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.carbsColor }]}>
                      {nutritionEstimation.carbs}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Carbs
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.fatColor }]}>
                      {nutritionEstimation.fat}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                      Fat
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
                onPress={() => onSave(selectedMealType)}
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
});
