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
  Animated,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  
  // Weight range in grams (50g to 550g)
  const MIN_WEIGHT = 50;
  const MAX_WEIGHT = 550;
  const [portionGrams, setPortionGrams] = useState(150); // Default 150g
  
  // Base nutrition values (for 150g serving)
  const [baseNutrition, setBaseNutrition] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  
  // Animated values - initialize once
  const [thumbScale] = useState(() => new Animated.Value(1));
  const [barWidthPercent] = useState(() => new Animated.Value((150 - 50) / 500 * 100));
  
  // Unit preference (default to 'g' for grams)
  const weightUnit = preferences?.units === 'lb' ? 'oz' : 'g';
  
  // Store base nutrition when estimation changes
  useEffect(() => {
    if (nutritionEstimation) {
      setBaseNutrition({
        calories: nutritionEstimation.calories,
        protein: nutritionEstimation.protein,
        carbs: nutritionEstimation.carbs,
        fat: nutritionEstimation.fat,
      });
    }
  }, [nutritionEstimation]);
  
  // Sync bar width with portion grams when modal opens or value changes externally
  useEffect(() => {
    if (visible) {
      const widthPercent = ((portionGrams - 50) / 500) * 100;
      barWidthPercent.setValue(widthPercent);
    }
  }, [visible, portionGrams]);
  
  // Calculate scaled nutrition based on weight
  const getScaledNutrition = () => {
    if (!baseNutrition) return baseNutrition;
    
    const scale = portionGrams / 150; // Scale from base 150g
    return {
      calories: Math.round(baseNutrition.calories * scale),
      protein: Math.round(baseNutrition.protein * scale * 10) / 10,
      carbs: Math.round(baseNutrition.carbs * scale * 10) / 10,
      fat: Math.round(baseNutrition.fat * scale * 10) / 10,
    };
  };
  
  // Update portion based on weight (for compatibility)
  const getPortionSize = (grams: number): PortionSize => {
    if (grams < 100) return 'small';
    if (grams > 200) return 'large';
    return 'medium';
  };
  
  // Handle slider change - update immediately during drag
  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value / 10) * 10; // Round to nearest 10g
    setPortionGrams(roundedValue);
    onSelectPortion(getPortionSize(roundedValue));
    
    // Update bar width immediately (0-100 for percentage)
    const widthPercent = ((roundedValue - 50) / 500) * 100;
    try {
      barWidthPercent.setValue(widthPercent);
    } catch (error) {
      console.warn('Error updating slider animation:', error);
    }
  };
  
  // Thumb animation on interaction
  const handleSlidingStart = () => {
    Animated.spring(thumbScale, {
      toValue: 1.3,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };
  
  const handleSlidingComplete = () => {
    Animated.spring(thumbScale, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();
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
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={styles.backdropGradient}
        />
        <BlurView intensity={60} tint="dark" style={styles.blurOverlay}>
          <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Image Preview with Glassy Header Overlay */}
          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              
              {/* Glassy Header Overlay on Image */}
              <BlurView intensity={40} tint="dark" style={styles.headerOverlay}>
                <View style={styles.headerContent}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.headerAccent, { backgroundColor: colors.accentBlue }]} />
                    <Text style={[styles.titleOverlay, { color: '#FFFFFF' }]}>
                      {nutritionEstimation ? 'NUTRITION ANALYSIS' : 'SELECT DISH'}
                    </Text>
                  </View>
                  <Pressable onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                  </Pressable>
                </View>
              </BlurView>
              
              {/* Bottom gradient fade */}
              <LinearGradient
                colors={['transparent', colors.background]}
                style={styles.imageBottomFade}
              />
            </View>
          )}

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentPadding}
            showsVerticalScrollIndicator={false}
          >
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

              {/* Portion Selector - Removed as per feedback */}

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
                  {/* Sci-Fi Confidence Badge */}
                  {nutritionEstimation.confidence !== undefined && (
                    <LinearGradient
                      colors={
                        nutritionEstimation.confidence >= 0.7
                          ? [colors.success + '30', colors.success + '10']
                          : nutritionEstimation.confidence >= 0.5
                          ? [colors.warning + '30', colors.warning + '10']
                          : [colors.error + '30', colors.error + '10']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confidenceBadge}
                    >
                      <Ionicons
                        name={nutritionEstimation.confidence >= 0.7 ? "shield-checkmark" : "analytics"}
                        size={18}
                        color={
                          nutritionEstimation.confidence >= 0.7
                            ? colors.success
                            : nutritionEstimation.confidence >= 0.5
                            ? colors.warning
                            : colors.error
                        }
                      />
                      <Text
                        style={[
                          styles.confidenceText,
                          {
                            color:
                              nutritionEstimation.confidence >= 0.7
                                ? colors.success
                                : nutritionEstimation.confidence >= 0.5
                                ? colors.warning
                                : colors.error,
                          },
                        ]}
                      >
                        {(nutritionEstimation.confidence * 100).toFixed(0)}% ACCURACY
                      </Text>
                    </LinearGradient>
                  )}

                  <Text style={[styles.dishNameLarge, { color: colors.textPrimary }]}>
                    {nutritionEstimation.dishName}
                  </Text>

                {/* Advanced Sci-Fi Portion Weight Slider */}
                <View style={styles.portionSliderContainer}>
                  {/* Header with Weight in Same Row */}
                  <View style={styles.sliderHeaderRow}>
                    <View style={styles.sliderLabelContainer}>
                      <View style={[styles.iconPulse, { backgroundColor: colors.accentBlue + '30' }]}>
                        <Ionicons name="barbell" size={16} color={colors.accentBlue} />
                      </View>
                      <Text style={[styles.sliderLabel, { color: colors.textPrimary }]}>
                        PORTION WEIGHT
                      </Text>
                    </View>
                    
                    <View style={styles.weightDisplaySimple}>
                      <Text style={[styles.weightValueSimple, { color: colors.accentBlue }]}>
                        {portionGrams}
                      </Text>
                      <Text style={[styles.weightUnitSimple, { color: colors.textSecondary }]}>
                        g
                      </Text>
                    </View>
                  </View>

                  {/* Custom Slider with Tick Marks */}
                  <View style={styles.sliderWrapper}>
                    {/* Tick Marks */}
                    <View style={styles.tickMarksContainer}>
                      {Array.from({ length: 51 }, (_, i) => 50 + i * 10).map((weight) => {
                        const majorMarks = [50, 150, 250, 350, 450, 550];
                        const isMajor = majorMarks.includes(weight);
                        const showLabel = isMajor;
                        const percentPosition = ((weight - 50) / 500) * 100;
                        const isActive = portionGrams >= weight;
                        const tickWidth = isMajor ? 2 : 1;
                        
                        return (
                          <View
                            key={weight}
                            style={[
                              styles.tickMarkWrapper,
                              {
                                left: `${percentPosition}%`,
                                marginLeft: -(tickWidth / 2) // Center the tick mark
                              }
                            ]}
                          >
                            <View
                              style={[
                                styles.tickMark,
                                {
                                  backgroundColor: isActive ? colors.accentBlue : colors.border,
                                  height: isMajor ? 16 : 8,
                                  width: tickWidth,
                                },
                              ]}
                            />
                            {showLabel && (
                              <Text
                                style={[
                                  styles.tickLabel,
                                  {
                                    color: isActive ? colors.accentBlue : colors.textSecondary,
                                    fontWeight: isActive ? '700' : '600',
                                  },
                                ]}
                              >
                                {weight === 50 || weight === 550 ? `${weight}g` : weight}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Enhanced Slider Track */}
                    <View style={styles.sliderTrackContainer}>
                      {/* Background Track */}
                      <View style={[styles.customTrack, { backgroundColor: colors.card }]} pointerEvents="none">
                        {/* Active Track with Gradient - Animated */}
                        <Animated.View
                          style={[
                            styles.activeTrackWrapper,
                            {
                              width: barWidthPercent.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                                extrapolate: 'clamp',
                              }),
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={[colors.accentBlue + '80', colors.accentBlue]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.activeTrack}
                          />
                        </Animated.View>
                      </View>

                      {/* Custom Animated Thumb */}
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.customThumb,
                          {
                            backgroundColor: colors.accentBlue,
                            left: barWidthPercent.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                              extrapolate: 'clamp',
                            }),
                          },
                        ]}
                      >
                        <Animated.View style={{ transform: [{ scale: thumbScale }] }}>
                          <View style={[styles.thumbInner, { backgroundColor: '#FFFFFF' }]} />
                        </Animated.View>
                      </Animated.View>

                      {/* Native Slider (invisible, for touch handling) */}
                      <Slider
                        style={styles.slider}
                        minimumValue={MIN_WEIGHT}
                        maximumValue={MAX_WEIGHT}
                        value={portionGrams}
                        onValueChange={handleSliderChange}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        minimumTrackTintColor="transparent"
                        maximumTrackTintColor="transparent"
                        thumbTintColor="transparent"
                        step={10}
                      />
                    </View>
                  </View>
                </View>

                {/* Dynamic Nutrition Grid with Sci-Fi Cards */}
                <View style={styles.nutritionGrid}>
                  {(() => {
                    const scaled = getScaledNutrition();
                    if (!scaled) return null;

                    const metrics = [
                      { label: 'CALORIES', value: scaled.calories, unit: 'kcal', color: colors.caloriesRing, icon: 'flame' },
                      { label: 'PROTEIN', value: scaled.protein, unit: 'g', color: colors.proteinColor, icon: 'fitness' },
                      { label: 'CARBS', value: scaled.carbs, unit: 'g', color: colors.carbsColor, icon: 'nutrition' },
                      { label: 'FAT', value: scaled.fat, unit: 'g', color: colors.fatColor, icon: 'water' },
                    ];

                    return metrics.map((metric) => (
                      <LinearGradient
                        key={metric.label}
                        colors={[metric.color + '15', metric.color + '05']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.metricCard}
                      >
                        <View style={styles.metricHeader}>
                          <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                            {metric.label}
                          </Text>
                        </View>
                        <Text style={[styles.metricValue, { color: metric.color }]}>
                          {metric.value}
                        </Text>
                        <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>
                          {metric.unit}
                        </Text>
                        <View style={[styles.metricAccent, { backgroundColor: metric.color }]} />
                      </LinearGradient>
                    ));
                  })()}
                </View>
              </View>

              {/* Meal Type Selector - Sci-Fi Style */}
              <View style={styles.mealTypeContainer}>
                <View style={styles.mealTypeLabelRow}>
                  <Ionicons name="time-outline" size={18} color={colors.accentBlue} />
                  <Text style={[styles.mealTypeLabel, { color: colors.textPrimary }]}>
                    MEAL TYPE
                  </Text>
                </View>
                <View style={styles.mealTypeButtons}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
                    const icons = {
                      breakfast: 'sunny',
                      lunch: 'restaurant',
                      dinner: 'moon',
                      snack: 'fast-food',
                    };
                    const isSelected = selectedMealType === type;
                    
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setSelectedMealType(type)}
                      >
                        <LinearGradient
                          colors={
                            isSelected
                              ? [colors.accentBlue, colors.accentBlue + 'CC']
                              : ['transparent', 'transparent']
                          }
                          style={[
                            styles.mealTypeButton,
                            {
                              borderColor: isSelected ? 'transparent' : colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={icons[type] as any}
                            size={18}
                            color={isSelected ? '#FFFFFF' : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.mealTypeButtonText,
                              {
                                color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              },
                            ]}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Save Button */}
              <LinearGradient
                colors={[colors.accentBlue, colors.accentBlue + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Pressable
                  onPress={() => {
                    const scaled = getScaledNutrition();
                    if (scaled) {
                      onSave(selectedMealType, {
                        ...scaled,
                        portionGrams,
                      });
                    }
                  }}
                  style={styles.saveButton}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>SAVE MEAL</Text>
                </Pressable>
              </LinearGradient>
              </>
            )}
            </ScrollView>
            </View>
          </BlurView>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  backdropGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    height: '98%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAccent: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleOverlay: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  imageBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  scrollContainer: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 40,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dishNameLarge: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
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
    marginBottom: 20,
  },
  mealTypeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  mealTypeLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  mealTypeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Compact Sci-Fi Slider Styles
  portionSliderContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPulse: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  // Simple Clean Weight Display
  weightDisplaySimple: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  weightValueSimple: {
    fontSize: 20,
    fontWeight: '700',
  },
  weightUnitSimple: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Slider Wrapper
  sliderWrapper: {
    paddingHorizontal: 4,
  },
  // Tick Marks
  tickMarksContainer: {
    position: 'relative',
    height: 32,
    marginBottom: 6,
    marginHorizontal: 12,
  },
  tickMarkWrapper: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  tickMark: {
    borderRadius: 1,
  },
  tickLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  // Custom Track
  sliderTrackContainer: {
    position: 'relative',
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  customTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
  },
  activeTrackWrapper: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  activeTrack: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  customThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    top: '50%',
    marginTop: -14,
    marginLeft: -14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slider: {
    position: 'absolute',
    width: '100%',
    height: 50,
    top: 0,
    opacity: 0.01,
  },
  // Range Labels
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  // Sci-Fi Nutrition Cards (Compact)
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 1,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  metricAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
  // Sci-Fi Save Button
  saveButtonGradient: {
    borderRadius: 16,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
