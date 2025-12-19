
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAppData } from '../../src/contexts/AppDataContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card } from '../../src/components/ui';
import { ProfileStatsCard, SettingItem } from '../../src/components/features/profile/components';
import { api } from '../../src/services/api';
import { UserPreferences, WeightLog, StreakData } from '../../src/types';
import { calculateBMI, getBMICategory } from '../../src/utils/calculations';

export default function ProfileScreen() {
  const { colors, borderRadius, toggleTheme, isDark } = useTheme();
  const { preferences, updatePreferences } = useAppData();
  const { logout, user } = useAuth();
  const router = useRouter();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{
    key: keyof UserPreferences;
    label: string;
    value: string;
  } | null>(null);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [weightRes, streakRes] = await Promise.all([
      api.weightLogs.getAll(),
      api.attendance.getStreak(),
    ]);

    if (weightRes.data) {
      const sorted = [...weightRes.data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWeightLogs(sorted);
    }
    if (streakRes.data) setStreakData(streakRes.data);
  };

  const saveGoal = async () => {
    if (!editingGoal) return;
    const value = parseFloat(editingGoal.value);
    if (isNaN(value) || value <= 0) return;

    await updatePreferences({ [editingGoal.key]: value });
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return colors.warning;
    if (bmi < 25) return colors.success;
    if (bmi < 30) return colors.warning;
    return colors.error;
  };

  const currentWeight = weightLogs[0]?.weight;
  const bmi = currentWeight && preferences?.height 
    ? calculateBMI(currentWeight, preferences.height, preferences?.units)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <ProfileStatsCard streakData={streakData} />

        {/* Body Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Body Stats</Text>
        <Card style={styles.settingsCard}>
          <SettingItem
            icon="scale-outline"
            label="Current Weight"
            value={currentWeight ? `${currentWeight} ${preferences?.units || 'kg'}` : '-- --'}
            type="navigation"
            valueColor={colors.accentBlue}
          />
          <SettingItem
            icon="resize-outline"
            label="Height"
            value={preferences?.height ? `${preferences.height} cm` : '-- cm'}
            type="select"
            hasBorder
            onPress={() => {
              setEditingGoal({
                key: 'height',
                label: 'Height (cm)',
                value: (preferences?.height || 170).toString(),
              });
              setShowGoalModal(true);
            }}
          />
          <View style={[styles.bmiItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.bmiLabel}>
              <Ionicons name="body-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                BMI
              </Text>
            </View>
            <View style={styles.bmiValue}>
              {currentWeight && preferences?.height ? (
                <>
                  <Text style={[styles.value, { color: getBMIColor(bmi) }]}>
                    {bmi.toFixed(1)}
                  </Text>
                  <Text style={[styles.bmiCategory, { color: getBMIColor(bmi) }]}>
                    {getBMICategory(bmi)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.value, { color: colors.textSecondary }]}>-- --</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Goals Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Goals</Text>
        <Card style={styles.settingsCard}>
          <SettingItem
            icon="flame-outline"
            label="Calorie Goal"
            value={`${preferences?.calorieGoal || 2200} kcal`}
            type="select"
            onPress={() => {
              setEditingGoal({
                key: 'calorieGoal',
                label: 'Calorie Goal',
                value: (preferences?.calorieGoal || 2200).toString(),
              });
              setShowGoalModal(true);
            }}
          />
          <SettingItem
            icon="nutrition-outline"
            label="Protein Goal"
            value={`${preferences?.proteinGoal || 150}g`}
            type="select"
            hasBorder
            valueColor={colors.proteinColor}
            onPress={() => {
              setEditingGoal({
                key: 'proteinGoal',
                label: 'Protein Goal',
                value: (preferences?.proteinGoal || 150).toString(),
              });
              setShowGoalModal(true);
            }}
          />
          <SettingItem
            icon="pizza-outline"
            label="Carbs Goal"
            value={`${preferences?.carbsGoal || 250}g`}
            type="select"
            hasBorder
            valueColor={colors.carbsColor}
            onPress={() => {
              setEditingGoal({
                key: 'carbsGoal',
                label: 'Carbs Goal',
                value: (preferences?.carbsGoal || 250).toString(),
              });
              setShowGoalModal(true);
            }}
          />
          <SettingItem
            icon="water-outline"
            label="Fat Goal"
            value={`${preferences?.fatGoal || 70}g`}
            type="select"
            hasBorder
            valueColor={colors.fatColor}
            onPress={() => {
              setEditingGoal({
                key: 'fatGoal',
                label: 'Fat Goal',
                value: (preferences?.fatGoal || 70).toString(),
              });
              setShowGoalModal(true);
            }}
          />
        </Card>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <SettingItem
            icon="moon"
            label="Dark Mode"
            value={isDark}
            type="toggle"
            onToggle={toggleTheme}
          />
          <View style={[styles.unitSetting, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.unitLabel}>
              <Ionicons name="scale" size={20} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>
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
                  onPress={() => updatePreferences({ units: u })}
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
          <SettingItem
            icon="information-circle"
            label="About Gymie"
            type="navigation"
            onPress={() => {}}
          />
          <SettingItem
            icon="star"
            label="Rate App"
            type="navigation"
            hasBorder
            onPress={() => {}}
          />
        </Card>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
        <Card style={styles.settingsCard}>
          <SettingItem
            icon="person-circle-outline"
            label="Logged in as"
            value={user?.email || 'User'}
            type="info"
          />
          <SettingItem
            icon="log-out-outline"
            label="Logout"
            type="navigation"
            hasBorder
            onPress={handleLogout}
            valueColor={colors.error}
          />
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
  bmiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bmiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  bmiValue: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  bmiCategory: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  unitSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unitLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
