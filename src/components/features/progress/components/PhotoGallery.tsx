
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ProgressPhoto } from '../../../../types';

interface PhotoGalleryProps {
  photos: ProgressPhoto[];
  groupedPhotos: [string, ProgressPhoto[]][];
  compareMode: boolean;
  selectedPhotos: string[];
  onPhotoPress: (photoId: string) => void;
  onPhotoLongPress: (photoId: string) => void;
  formatMonthYear: (key: string) => string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  groupedPhotos,
  compareMode,
  selectedPhotos,
  onPhotoPress,
  onPhotoLongPress,
  formatMonthYear,
}) => {
  const { colors } = useTheme();

  return (
    <>
      {groupedPhotos.map(([monthKey, photos]) => (
        <View key={monthKey} style={styles.monthGroup}>
          <Text style={[styles.monthTitle, { color: colors.textSecondary }]}>
            {formatMonthYear(monthKey)}
          </Text>
          <View style={styles.photoGrid}>
            {photos.map(photo => (
              <Pressable
                key={photo.id}
                style={[
                  styles.photoItem,
                  compareMode && selectedPhotos.includes(photo.id) && {
                    borderColor: colors.accentBlue,
                    borderWidth: 3,
                  }
                ]}
                onPress={() => onPhotoPress(photo.id)}
                onLongPress={() => onPhotoLongPress(photo.id)}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                {compareMode && selectedPhotos.includes(photo.id) && (
                  <View style={[styles.selectedOverlay, { backgroundColor: colors.accentBlue + '40' }]}>
                    <View style={[styles.selectedBadge, { backgroundColor: colors.accentBlue }]}>
                      <Text style={styles.selectedNumber}>
                        {selectedPhotos.indexOf(photo.id) + 1}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={[styles.photoDateBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={styles.photoDateText}>
                    {new Date(photo.date).getDate()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  monthGroup: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
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
  photoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNumber: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  photoDateBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoDateText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
