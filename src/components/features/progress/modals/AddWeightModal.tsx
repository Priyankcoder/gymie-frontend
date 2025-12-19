
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';

interface AddWeightModalProps {
  visible: boolean;
  unit: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddWeightModal: React.FC<AddWeightModalProps> = ({
  visible,
  unit,
  onClose,
  onSuccess,
}) => {
  const { colors, borderRadius } = useTheme();
  const [weight, setWeight] = useState('');

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) return;

    await api.weightLogs.create({
      date: new Date().toISOString().split('T')[0],
      weight: weightValue,
      unit,
    });
    setWeight('');
    onClose();
    onSuccess();
  };

  const handleClose = () => {
    setWeight('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.content, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Log Body Weight</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderRadius: borderRadius.md,
              }
            ]}
            value={weight}
            onChangeText={setWeight}
            placeholder={`Enter weight (${unit})`}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            autoFocus
          />
          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.inputBackground }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accentBlue }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: '#FFF' }]}>Save</Text>
            </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
