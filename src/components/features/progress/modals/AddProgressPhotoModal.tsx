
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Button } from '../../../ui';

interface AddProgressPhotoModalProps {
  visible: boolean;
  photoUri: string | null;
  onClose: () => void;
  onSave: (weight?: number, notes?: string) => void;
  units?: 'kg' | 'lb';
}

export const AddProgressPhotoModal: React.FC<AddProgressPhotoModalProps> = ({
  visible,
  photoUri,
  onClose,
  onSave,
  units = 'kg',
}) => {
  const { colors, borderRadius } = useTheme();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const weightValue = weight ? parseFloat(weight) : undefined;
    onSave(weightValue, notes || undefined);
    // Reset form
    setWeight('');
    setNotes('');
  };

  const handleClose = () => {
    setWeight('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Add Progress Photo
            </Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Photo Preview */}
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
          )}

          {/* Weight Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Ionicons name="scale-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Weight (optional)
              </Text>
            </View>
            <View style={styles.weightInputRow}>
              <TextInput
                style={[
                  styles.weightInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={weight}
                onChangeText={setWeight}
                placeholder={`Enter weight`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {units}
              </Text>
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Notes (optional)
              </Text>
            </View>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this photo..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.card, borderRadius: borderRadius.md },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </Pressable>
            <Button
              title="Save Photo"
              onPress={handleSave}
              style={styles.button}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesInput: {
    height: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
