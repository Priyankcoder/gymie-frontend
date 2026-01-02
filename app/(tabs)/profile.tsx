
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProfileHeader } from '../../src/components/features/profile/components/ProfileHeader';
import { ProfileStatsCard } from '../../src/components/features/profile/components/ProfileStatsCard';
import { SettingsSection } from '../../src/components/features/profile/components/SettingsSection';
import { EditProfileModal } from '../../src/components/features/profile/modals/EditProfileModal';
import { useProfile } from '../../src/hooks/useProfile';

export default function ProfileScreen() {
  const { colors, isDark, typography } = useTheme();
  const { profile, loading, updateProfile } = useProfile();
  const [editModalVisible, setEditModalVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Edit Button */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary, ...typography.h1 }]}>
            Profile
          </Text>
          <Pressable
            style={[styles.editButton, { backgroundColor: colors.card }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.accentBlue} />
            <Text style={[styles.editText, { color: colors.accentBlue }]}>Edit</Text>
          </Pressable>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          displayName={profile?.displayName}
          email={profile?.email}
          profilePicture={profile?.profilePicture}
          onEditPress={() => setEditModalVisible(true)}
        />

        {/* Stats Card */}
        <ProfileStatsCard streakData={null} />

          {/* Settings Sections */}
          <SettingsSection />
        </ScrollView>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
        onSave={updateProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
