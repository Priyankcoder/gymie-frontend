
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { MealEstimation } from '../../../../types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AIEstimationModalProps {
  visible: boolean;
  selectedImage: string | null;
  aiEstimation: MealEstimation | null;
  isEstimating: boolean;
  selectedMealType: MealType;
  onClose: () => void;
  onSave: () => void;
  onSelectMealType: (type: MealType) => void;
}

export const AIEstimationModal: React.FC<AIEstimationModalProps> = ({
  visible,
  selectedImage,
  aiEstimation,
  isEstimating,
  selectedMealType,
  onClose,
  onSave,
  onSelectMealType,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>AI Estimation</Text>
            <Pressable onPress={onClose}>
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
                    onPress={() => onSelectMealType(type)}
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
              <Button title="Add to Diary" onPress={onSave} style={{ marginTop: 16 }} />
            </View>
          ) : null}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 20,
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
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  mealTypeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
