
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';

interface ProfileHeaderProps {
  displayName?: string;
  email?: string;
  profilePicture?: string;
  onEditPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  email,
  profilePicture,
  onEditPress,
}) => {
  const { colors, typography } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Reset error state when profile picture changes
  useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  // Show placeholder if no image or image error
  // Note: file:// URIs work during current session but not after app restart
  const shouldShowPlaceholder = !profilePicture || imageError;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.avatarContainer}>
        {!shouldShowPlaceholder ? (
          <Image
            key={profilePicture}
            source={{ uri: profilePicture }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="person" size={50} color={colors.textSecondary} />
          </View>
        )}
        <Pressable
          style={[styles.editAvatarButton, { backgroundColor: colors.accentBlue }]}
          onPress={onEditPress}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.displayName, { color: colors.textPrimary, ...typography.h2 }]}>
          {displayName || 'Set Display Name'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {email || 'user@example.com'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
});
