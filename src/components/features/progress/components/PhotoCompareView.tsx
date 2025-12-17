
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ProgressPhoto } from '../../../../types';

interface PhotoCompareViewProps {
  selectedPhotos: string[];
  photos: ProgressPhoto[];
}

export const PhotoCompareView: React.FC<PhotoCompareViewProps> = ({
  selectedPhotos,
  photos,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        {selectedPhotos.map((photoId) => {
          const photo = photos.find(p => p.id === photoId);
          if (!photo) return null;
          return (
            <View key={photo.id} style={styles.photo}>
              <Image source={{ uri: photo.uri }} style={styles.image} />
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {new Date(photo.date).toLocaleDateString()}
              </Text>
            </View>
          );
        })}
        {selectedPhotos.length === 1 && (
          <View style={[styles.photo, styles.placeholder, { borderColor: colors.border }]}>
            <Ionicons name="add" size={32} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Select another photo
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
  },
  placeholder: {
    aspectRatio: 3 / 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 8,
  },
});
