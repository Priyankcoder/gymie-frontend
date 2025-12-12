
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Image,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card, Button } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { ProgressPhoto, UserPreferences, WeightLog, StreakData } from '../../src/types';

export default function ProfileScreen() {
  const { colors, borderRadius, toggleTheme, isDark } = useTheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'settings' | 'weight' | 'photos'>('settings');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
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
    const [prefsRes, photosRes, weightRes, streakRes] = await Promise.all([
      localApi.preferences.get(),
      localApi.photos.getAll(),
      localApi.weightLogs.getAll(),
      localApi.attendance.getStreak(),
    ]);

    if (prefsRes.data) setPreferences(prefsRes.data);
    if (photosRes.data) setProgressPhotos(photosRes.data);
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

  const logWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    await localApi.weightLogs.create({
      date: new Date().toISOString().split('T')[0],
      weight,
      unit: preferences?.units || 'kg',
    });
    setNewWeight('');
    setShowWeightModal(false);
    loadData();
  };

  const saveGoal = async () => {
    if (!editingGoal) return;
    const value = parseFloat(editingGoal.value);
    if (isNaN(value) || value <= 0) return;

    await updatePreference(editingGoal.key, value);
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  const pickProgressPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const latestWeight = weightLogs[0]?.weight;
      const newPhoto: Omit<ProgressPhoto, 'id'> = {
        uri: result.assets[0].uri,
        date: new Date().toISOString().split('T')[0],
        weight: latestWeight,
      };
      await localApi.photos.create(newPhoto);
      loadData();
    }
  };

  const takeProgressPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const latestWeight = weightLogs[0]?.weight;
      const newPhoto: Omit<ProgressPhoto, 'id'> = {
        uri: result.assets[0].uri,
        date: new Date().toISOString().split('T')[0],
        weight: latestWeight,
      };
      await localApi.photos.create(newPhoto);
      loadData();
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(selectedPhotos.filter((id) => id !== photoId));
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos([...selectedPhotos, photoId]);
    }
  };

  const groupPhotosByMonth = () => {
    const grouped: { [key: string]: ProgressPhoto[] } = {};
    progressPhotos.forEach((photo) => {
      const monthKey = photo.date.substring(0, 7);
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(photo);
    });
    return grouped;
  };

  const formatMonthYear = (monthKey: string) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getWeightChange = () => {
    if (weightLogs.length < 2) return null;
    const latest = weightLogs[0].weight;
    const previous = weightLogs[1].weight;
    return latest - previous;
  };

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
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
  );

  const renderWeightTab = () => {
    const weightChange = getWeightChange();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Current Weight Card */}
        <Card style={styles.currentWeightCard}>
          <View style={styles.currentWeightHeader}>
            <Text style={[styles.currentWeightLabel, { color: colors.textSecondary }]}>
              Current Weight
            </Text>
            <Pressable 
              style={[styles.addWeightButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => setShowWeightModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </Pressable>
          </View>
          <View style={styles.currentWeightValue}>
            <Text style={[styles.weightNumber, { color: colors.textPrimary }]}>
              {weightLogs[0]?.weight || '--'}
            </Text>
            <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>
              {preferences?.units || 'kg'}
            </Text>
          </View>
          {weightChange !== null && (
            <View style={[
              styles.weightChangeBadge,
              { backgroundColor: weightChange <= 0 ? `${colors.success}20` : `${colors.error}20` }
            ]}>
              <Ionicons
                name={weightChange <= 0 ? 'trending-down' : 'trending-up'}
                size={16}
                color={weightChange <= 0 ? colors.success : colors.error}
              />
              <Text style={[
                styles.weightChangeText,
                { color: weightChange <= 0 ? colors.success : colors.error }
              ]}>
                {Math.abs(weightChange).toFixed(1)} {preferences?.units || 'kg'} from last
              </Text>
            </View>
          )}
        </Card>

        {/* Target Weight */}
        <Card style={styles.targetWeightCard}>
          <Pressable 
            style={styles.targetWeightContent}
            onPress={() => {
              setEditingGoal({
                key: 'targetWeight',
                label: 'Target Weight',
                value: (preferences?.targetWeight || 70).toString(),
              });
              setShowGoalModal(true);
            }}
          >
            <View>
              <Text style={[styles.targetWeightLabel, { color: colors.textSecondary }]}>
                Target Weight
              </Text>
              <Text style={[styles.targetWeightValue, { color: colors.textPrimary }]}>
                {preferences?.targetWeight || '--'} {preferences?.units || 'kg'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </Card>

        {/* Weight History */}
        <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Weight History</Text>
        {weightLogs.length === 0 ? (
          <View style={styles.emptyWeightHistory}>
            <Ionicons name="scale-outline" size={50} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No weight entries yet
            </Text>
            <Button 
              title="Log Weight" 
              onPress={() => setShowWeightModal(true)} 
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          weightLogs.map((log, index) => (
            <View 
              key={log.id} 
              style={[styles.weightLogItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.weightLogDate, { color: colors.textSecondary }]}>
                  {new Date(log.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={[styles.weightLogValue, { color: colors.textPrimary }]}>
                {log.weight} {log.unit}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderPhotosTab = () => {
    const groupedPhotos = groupPhotosByMonth();
    const monthKeys = Object.keys(groupedPhotos).sort().reverse();

    return (
      <View style={styles.tabContent}>
        {/* Action Bar */}
        <View style={styles.photosActionBar}>
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: compareMode ? colors.accentBlue : colors.inputBackground,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => {
              setCompareMode(!compareMode);
              setSelectedPhotos([]);
            }}
          >
            <Ionicons
              name="git-compare"
              size={20}
              color={compareMode ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: compareMode ? '#FFF' : colors.textSecondary },
              ]}
            >
              Compare
            </Text>
          </Pressable>
          <View style={styles.addPhotoButtons}>
            <Pressable
              style={[styles.addPhotoButton, { backgroundColor: colors.inputBackground }]}
              onPress={takeProgressPhoto}
            >
              <Ionicons name="camera" size={24} color={colors.accentBlue} />
            </Pressable>
            <Pressable
              style={[styles.addPhotoButton, { backgroundColor: colors.accentBlue }]}
              onPress={pickProgressPhoto}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Compare View */}
        {compareMode && selectedPhotos.length === 2 && (
          <View style={styles.compareView}>
            {selectedPhotos.map((photoId) => {
              const photo = progressPhotos.find((p) => p.id === photoId);
              if (!photo) return null;
              return (
                <View key={photoId} style={styles.comparePhoto}>
                  <Image source={{ uri: photo.uri }} style={styles.compareImage} />
                  <Text style={[styles.compareDate, { color: colors.textSecondary }]}>
                    {new Date(photo.date).toLocaleDateString()}
                  </Text>
                  {photo.weight && (
                    <Text style={[styles.compareWeight, { color: colors.accentBlue }]}>
                      {photo.weight} {preferences?.units || 'kg'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Photo Timeline */}
        <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
          {progressPhotos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Progress Photos
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Take photos to track your transformation
              </Text>
            </View>
          ) : (
            monthKeys.map((monthKey) => (
              <View key={monthKey} style={styles.monthSection}>
                <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                  {formatMonthYear(monthKey)}
                </Text>
                <View style={styles.photoGrid}>
                  {groupedPhotos[monthKey].map((photo) => (
                    <Pressable
                      key={photo.id}
                      style={[
                        styles.photoItem,
                        compareMode &&
                          selectedPhotos.includes(photo.id) && {
                            borderColor: colors.accentBlue,
                            borderWidth: 3,
                          },
                      ]}
                      onPress={() => compareMode && togglePhotoSelection(photo.id)}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                      <View style={styles.photoOverlay}>
                        <Text style={styles.photoDate}>
                          {new Date(photo.date).getDate()}
                        </Text>
                        {photo.weight && (
                          <Text style={styles.photoWeight}>
                            {photo.weight}
                          </Text>
                        )}
                      </View>
                      {compareMode && selectedPhotos.includes(photo.id) && (
                        <View style={[styles.selectedBadge, { backgroundColor: colors.accentBlue }]}>
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['settings', 'weight', 'photos'] as const).map((tab) => (
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
              {tab === 'settings' ? 'Settings' : tab === 'weight' ? 'Weight' : 'Photos'}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedTab === 'settings' && renderSettingsTab()}
      {selectedTab === 'weight' && renderWeightTab()}
      {selectedTab === 'photos' && renderPhotosTab()}

      {/* Weight Log Modal */}
      <Modal visible={showWeightModal} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.weightModalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Weight</Text>
            <TextInput
              style={[
                styles.weightInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder={`Enter weight (${preferences?.units || 'kg'})`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => {
                  setShowWeightModal(false);
                  setNewWeight('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accentBlue }]}
                onPress={logWeight}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Goal Edit Modal */}
      <Modal visible={showGoalModal} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.weightModalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingGoal?.label || 'Edit Goal'}
            </Text>
            <TextInput
              style={[
                styles.weightInput,
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
  versionText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  currentWeightCard: {
    marginBottom: 12,
  },
  currentWeightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentWeightLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  addWeightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentWeightValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  weightUnit: {
    fontSize: 20,
    marginLeft: 8,
  },
  weightChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  weightChangeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  targetWeightCard: {
    marginBottom: 20,
  },
  targetWeightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetWeightLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  targetWeightValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyWeightHistory: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  weightLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  weightLogDate: {
    fontSize: 14,
  },
  weightLogValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  photosActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addPhotoButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareView: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  comparePhoto: {
    flex: 1,
  },
  compareImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  compareDate: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  compareWeight: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  photosContainer: {
    flex: 1,
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  photoWeight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  weightModalContent: {
    width: '85%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  weightInput: {
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
