
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Button } from '../../../ui';

interface Profile {
  displayName?: string;
  email?: string;
  profilePicture?: string;
}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile?: Profile | null;
  onSave: (updates: Partial<Profile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profile,
  onSave,
}) => {
  const { colors, typography } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setDisplayName(profile.displayName || '');
      setProfilePicture(profile.profilePicture);
      setImageError(false);
    }
  }, [visible, profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        profilePicture,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, ...typography.h2 }]}>
              Edit Profile
            </Text>
            <Pressable onPress={onClose} disabled={isSaving}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Picture */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Profile Picture</Text>
              <Pressable style={styles.avatarContainer} onPress={showImageOptions}>
                {profilePicture && !imageError ? (
                  <Image
                    key={profilePicture}
                    source={{ uri: profilePicture }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="person" size={60} color={colors.textSecondary} />
                  </View>
                )}
                <View style={[styles.cameraOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
              </Pressable>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Tap to change photo
              </Text>
            </View>

            {/* Display Name */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textSecondary}
                maxLength={30}
                editable={!isSaving}
              />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {displayName.length}/30 characters
              </Text>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.textSecondary,
                    borderColor: colors.border,
                  },
                ]}
                value={profile?.email}
                editable={false}
              />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Email cannot be changed
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Button
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
  },
});
