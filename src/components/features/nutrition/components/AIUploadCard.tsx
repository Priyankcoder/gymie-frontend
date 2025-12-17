
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';

interface AIUploadCardProps {
  onTakePhoto: () => void;
  onPickPhoto: () => void;
}

export const AIUploadCard: React.FC<AIUploadCardProps> = ({
  onTakePhoto,
  onPickPhoto,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Ionicons name="camera" size={32} color={colors.accentBlue} />
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            AI Meal Estimation
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Upload a photo to estimate macros
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <Button title="Take Photo" variant="outline" size="sm" onPress={onTakePhoto} />
        <Button title="Upload" size="sm" onPress={onPickPhoto} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: {
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
});
