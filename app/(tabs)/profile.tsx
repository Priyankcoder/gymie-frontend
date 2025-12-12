

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { UserPreferences, WeightLog, StreakData } from '../../src/types';

export default function ProfileScreen() {
  const { colors, borderRadius, toggleTheme, isDark } = useTheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{
    key: keyof UserPreferences;
    label: string;
    value: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [prefsRes, weightRes, streakRes] = await Promise.all([
      localApi.preferences.get(),
      localApi.weightLogs.getAll(),
      localApi.attendance.getStreak(),
    ]);

    if (prefsRes.data) setPreferences(prefsRes.data);
    if (weightRes.data) {
      const sorted = [...weightRes.data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWeightLogs(sorted);
    }
    if (streakRes.data) setStreakData(streakRes.data);
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await localApi.preferences.update({ [key]: value });
  };

  const saveGoal = async () => {
    if (!editingGoal) return;
    const value = parseFloat(editingGoal.value);
    if (isNaN(value) || value <= 0) return;

    await updatePreference(editingGoal.key, value);
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const calculateBMI = (): number => {
    const weight = weightLogs[0]?.weight;
    const height = preferences?.height;
    if (!weight || !height) return 0;
    
    const weightKg = preferences?.units === 'lb' ? weight * 0.453592 : weight;
    const heightM = height / 100;
    
    return weightKg / (heightM * heightM);
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return colors.warning;
    if (bmi < 25) return colors.success;
    if (bmi < 30) return colors.warning;
    return colors.error;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                🔥 {streakData?.currentStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Current Streak
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accentBlue }]}>
                {streakData?.totalWorkouts || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Workouts
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {streakData?.thisMonthWorkouts || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                This Month
              </Text>
            </View>
          </View>
        </Card>

        {/* Body Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Body Stats</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="scale-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                Current Weight
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.accentBlue }]}>
              {weightLogs[0]?.weight ? `${weightLogs[0].weight} ${preferences?.units || 'kg'}` : '-- --'}
            </Text>
          </View>
          <Pressable
            style={[styles.settingItem, { borderTopColor: colors.border, borderTopWidth: 1 }]}
            onPress={() => {
              setEditingGoal({
                key: 'height',
                label: 'Height (cm)',
                value: (preferences?.height || 170).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <View style={styles.settingLabelContainer}>
              <Ionicons name="resize-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                Height
              </Text>
            </View>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.accentBlue }]}>
                {preferences?.height ? `${preferences.height} cm` : '-- cm'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
          <View style={[styles.settingItem, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="body-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                BMI
              </Text>
            </View>
            <View style={styles.bmiContainer}>
              {weightLogs[0]?.weight && preferences?.height ? (
                <>
                  <Text style={[styles.settingValue, { color: getBMIColor(calculateBMI()) }]}>
                    {calculateBMI().toFixed(1)}
                  </Text>
                  <Text style={[styles.bmiCategory, { color: getBMIColor(calculateBMI()) }]}>
                    {getBMICategory(calculateBMI())}
                  </Text>
                </>
              ) : (
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>-- --</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Goals Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Goals</Text>
        <Card style={styles.settingsCard}>
          <Pressable 
            style={styles.settingItem}
            onPress={() => {
              setEditingGoal({
                key: 'calorieGoal',
                label: 'Calorie Goal',
                value: (preferences?.calorieGoal || 2200).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Calorie Goal</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.accentBlue }]}>
                {preferences?.calorieGoal || 2200} kcal
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
          <Pressable 
            style={[styles.settingItem, { borderTopColor: colors.border }]}
            onPress={() => {
              setEditingGoal({
                key: 'proteinGoal',
                label: 'Protein Goal',
                value: (preferences?.proteinGoal || 150).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Protein Goal</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.proteinColor }]}>
                {preferences?.proteinGoal || 150}g
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
          <Pressable 
            style={[styles.settingItem, { borderTopColor: colors.border }]}
            onPress={() => {
              setEditingGoal({
                key: 'carbsGoal',
                label: 'Carbs Goal',
                value: (preferences?.carbsGoal || 250).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Carbs Goal</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.carbsColor }]}>
                {preferences?.carbsGoal || 250}g
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
          <Pressable 
            style={[styles.settingItem, { borderTopColor: colors.border }]}
            onPress={() => {
              setEditingGoal({
                key: 'fatGoal',
                label: 'Fat Goal',
                value: (preferences?.fatGoal || 70).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Fat Goal</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.fatColor }]}>
                {preferences?.fatGoal || 70}g
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
        </Card>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accentBlue }}
              thumbColor="#FFF"
            />
          </View>
          <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="scale" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                Weight Units
              </Text>
            </View>
            <View style={styles.unitToggle}>
              {(['kg', 'lb'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[
                    styles.unitOption,
                    {
                      backgroundColor: preferences?.units === u ? colors.accentBlue : colors.inputBackground,
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                  onPress={() => updatePreference('units', u)}
                >
                  <Text style={[styles.unitText, { color: preferences?.units === u ? '#FFF' : colors.textSecondary }]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
        <Card style={styles.settingsCard}>
          <Pressable style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                About Gymie
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={[styles.settingItem, { borderTopColor: colors.border }]}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="star" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
                Rate App
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </Card>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal visible={showGoalModal} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingGoal?.label || 'Edit Goal'}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
              value={editingGoal?.value || ''}
              onChangeText={(text) => setEditingGoal(prev => prev ? { ...prev, value: text } : null)}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => {
                  setShowGoalModal(false);
                  setEditingGoal(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accentBlue }]}
                onPress={saveGoal}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  settingsCard: {
    marginBottom: 24,
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  unitOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bmiContainer: {
    alignItems: 'flex-end',
  },
  bmiCategory: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  versionText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
