
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card } from '../../src/components/ui';
import { localApi } from '../../src/services/localApi';
import { ProgressPhoto, UserPreferences } from '../../src/types';

export default function ProfileScreen() {
  const { colors, borderRadius, toggleTheme, isDark } = useTheme();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedTab, setSelectedTab] = useState<'settings' | 'photos'>('settings');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [prefsRes, photosRes] = await Promise.all([
      localApi.preferences.get(),
      localApi.photos.getAll(),
    ]);

    if (prefsRes.data) setPreferences(prefsRes.data);
    if (photosRes.data) setProgressPhotos(photosRes.data);
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await localApi.preferences.update({ [key]: value });
  };

  const pickProgressPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: Omit<ProgressPhoto, 'id'> = {
        uri: result.assets[0].uri,
        date: new Date().toISOString().split('T')[0],
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
      const newPhoto: Omit<ProgressPhoto, 'id'> = {
        uri: result.assets[0].uri,
        date: new Date().toISOString().split('T')[0],
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
      const monthKey = photo.date.substring(0, 7); // YYYY-MM
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

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileContent}>
          <View style={[styles.avatar, { backgroundColor: colors.accentBlue }]}>
            <Ionicons name="person" size={40} color="#FFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>Gymie User</Text>
            <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]}>
              Fitness Enthusiast
            </Text>
          </View>
        </View>
      </Card>

      {/* Goals Section */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Goals</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Calorie Goal</Text>
          <Text style={[styles.settingValue, { color: colors.accentBlue }]}>
            {preferences?.calorieGoal || 2200} kcal
          </Text>
        </View>
        <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Protein Goal</Text>
          <Text style={[styles.settingValue, { color: colors.proteinColor }]}>
            {preferences?.proteinGoal || 150}g
          </Text>
        </View>
        <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Carbs Goal</Text>
          <Text style={[styles.settingValue, { color: colors.carbsColor }]}>
            {preferences?.carbsGoal || 250}g
          </Text>
        </View>
        <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Fat Goal</Text>
          <Text style={[styles.settingValue, { color: colors.fatColor }]}>
            {preferences?.fatGoal || 70}g
          </Text>
        </View>
        <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Steps Goal</Text>
          <Text style={[styles.settingValue, { color: colors.stepsColor }]}>
            {preferences?.stepsGoal?.toLocaleString() || '10,000'}
          </Text>
        </View>
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
        <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="footsteps" size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
              Steps Sync
            </Text>
          </View>
          <Switch
            value={preferences?.stepsSync || false}
            onValueChange={(value) => updatePreference('stepsSync', value)}
            trackColor={{ false: colors.border, true: colors.accentBlue }}
            thumbColor="#FFF"
          />
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
            <Ionicons name="document-text" size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.textPrimary, marginLeft: 12 }]}>
              Privacy Policy
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
                      <Text style={[styles.photoDate, { color: colors.textSecondary }]}>
                        {new Date(photo.date).getDate()}
                      </Text>
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
        {(['settings', 'photos'] as const).map((tab) => (
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
              {tab === 'settings' ? 'Settings' : 'Progress Photos'}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedTab === 'settings' && renderSettingsTab()}
      {selectedTab === 'photos' && renderPhotosTab()}
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
  profileCard: {
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileSubtitle: {
    fontSize: 14,
    marginTop: 4,
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
  photoDate: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 12,
    fontWeight: '600',
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
});
