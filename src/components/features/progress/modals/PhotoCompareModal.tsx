
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Button } from '../../../ui';
import { ProgressPhoto } from '../../../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhotoCompareModalProps {
  visible: boolean;
  photos: ProgressPhoto[];
  selectedPhotoIds: string[];
  onClose: () => void;
}

type CompareMode = 'side-by-side' | 'overlay' | 'split';

const AI_COMMENTS = [
  "Amazing transformation! Your hard work is clearly paying off! 💪",
  "Incredible progress! You're crushing your fitness goals! 🔥",
  "Look at that definition! Keep up the phenomenal work! ⭐",
  "Outstanding results! Your dedication is truly inspiring! 🎯",
  "Wow! The changes are remarkable! You're doing great! 🌟",
  "Fantastic progress! Your consistency is showing results! 💯",
  "Impressive transformation! Keep pushing forward! 🚀",
  "Remarkable changes! You're on the right track! ✨",
  "Stellar progress! Your commitment is admirable! 🏆",
  "Phenomenal results! You're becoming stronger every day! ⚡",
];

export const PhotoCompareModal: React.FC<PhotoCompareModalProps> = ({
  visible,
  photos,
  selectedPhotoIds,
  onClose,
}) => {
  const { colors, borderRadius } = useTheme();
  const [compareMode, setCompareMode] = useState<CompareMode>('side-by-side');
  const [aiComment] = useState(AI_COMMENTS[Math.floor(Math.random() * AI_COMMENTS.length)]);
  const comparisonRef = useRef(null);

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id));
  const [photo1, photo2] = selectedPhotos;

  if (!photo1 || !photo2) return null;

  const captureAndShare = async () => {
    try {
      // Capture the comparison view
      const uri = await captureRef(comparisonRef, {
        format: 'jpg',
        quality: 0.9,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Your Progress',
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const calculateDaysDifference = () => {
    const date1 = new Date(photo1.date);
    const date2 = new Date(photo2.date);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateWeightChange = () => {
    if (photo1.weight && photo2.weight) {
      const change = photo2.weight - photo1.weight;
      return change.toFixed(1);
    }
    return null;
  };

  const daysDiff = calculateDaysDifference();
  const weightChange = calculateWeightChange();

  const renderComparison = () => {
    switch (compareMode) {
      case 'side-by-side':
        return (
          <View style={styles.sideBySide}>
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo1.uri }}
                style={styles.comparePhoto}
                resizeMode="cover"
              />
              <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>
                Before
              </Text>
            </View>
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo2.uri }}
                style={styles.comparePhoto}
                resizeMode="cover"
              />
              <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>
                After
              </Text>
            </View>
          </View>
        );
      
      case 'overlay':
        return (
          <View style={styles.overlayContainer}>
            <Image
              source={{ uri: photo1.uri }}
              style={styles.fullPhoto}
              resizeMode="cover"
            />
            <Image
              source={{ uri: photo2.uri }}
              style={[styles.fullPhoto, styles.overlayPhoto, { opacity: 0.5 }]}
              resizeMode="cover"
            />
          </View>
        );
      
      case 'split':
        return (
          <View style={styles.splitContainer}>
            <View style={styles.splitLeft}>
              <Image
                source={{ uri: photo1.uri }}
                style={styles.fullPhoto}
                resizeMode="cover"
              />
            </View>
            <View style={styles.splitRight}>
              <Image
                source={{ uri: photo2.uri }}
                style={styles.fullPhoto}
                resizeMode="cover"
              />
            </View>
            <View style={styles.splitDivider} />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Progress Comparison
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.accentBlue} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Time Span
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {daysDiff} days
              </Text>
            </View>
            {weightChange && (
              <View style={styles.statItem}>
                <Ionicons name="scale-outline" size={20} color={colors.accentBlue} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Weight Change
                </Text>
                <Text style={[styles.statValue, { color: parseFloat(weightChange) < 0 ? colors.success : colors.warning }]}>
                  {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                </Text>
              </View>
            )}
          </View>

          {/* AI Comment */}
          <View style={[styles.aiCommentContainer, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="sparkles" size={20} color={colors.success} />
            <Text style={[styles.aiComment, { color: colors.success }]}>
              {aiComment}
            </Text>
          </View>

          {/* Compare Mode Selector */}
          <View style={styles.modeSelector}>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
              Compare Mode
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeOptions}>
              {(['side-by-side', 'overlay', 'split'] as CompareMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor: compareMode === mode ? colors.accentBlue : colors.card,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => setCompareMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      { color: compareMode === mode ? '#FFF' : colors.textPrimary },
                    ]}
                  >
                    {mode === 'side-by-side' && '◧ Side by Side'}
                    {mode === 'overlay' && '⊕ Overlay'}
                    {mode === 'split' && '⊞ Split'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Photo Comparison */}
          <View style={styles.comparisonContainer} ref={comparisonRef} collapsable={false}>
            {renderComparison()}
          </View>

          {/* Share Button */}
          <View style={styles.actionContainer}>
            <Button
              title="Share"
              onPress={captureAndShare}
              icon={<Ionicons name="share-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
              style={styles.shareButton}
            />
            <Text style={[styles.shareHint, { color: colors.textSecondary }]}>
              Share to any app on your device
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  aiCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  aiComment: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  modeSelector: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modeOptions: {
    flexDirection: 'row',
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sideBySide: {
    flexDirection: 'row',
    gap: 8,
  },
  photoContainer: {
    flex: 1,
  },
  comparePhoto: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  photoLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  overlayContainer: {
    position: 'relative',
    height: 500,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlayPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  splitContainer: {
    position: 'relative',
    height: 500,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  splitLeft: {
    width: '50%',
    overflow: 'hidden',
  },
  splitRight: {
    width: '50%',
    overflow: 'hidden',
  },
  splitDivider: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#FFF',
    left: '50%',
    marginLeft: -1,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  shareButton: {
    marginBottom: 8,
  },
  shareHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
