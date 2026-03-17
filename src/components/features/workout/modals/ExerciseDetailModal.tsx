/**
 * ExerciseDetailModal
 *
 * Production-ready exercise detail sheet with:
 *  - Crossfade animation between start / end position images
 *  - Auto-cycle every 2.5 s (pauses 5 s after manual tap)
 *  - Dot indicator showing which frame is active
 *  - Tap backdrop to dismiss
 *  - Haptics on image toggle
 *  - Metadata chips: level (color-coded), force, mechanic, equipment
 *  - Primary / secondary muscle chips
 *  - Numbered step-by-step instructions
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ExerciseInfo } from '../../../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  expert: '#EF4444',
};

const FORCE_ICONS: Record<string, string> = {
  push: 'arrow-up-outline',
  pull: 'arrow-down-outline',
  static: 'pause-outline',
};

const AUTO_CYCLE_MS = 2500;
const MANUAL_PAUSE_MS = 5000;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExerciseDetailModalProps {
  visible: boolean;
  exercise: ExerciseInfo | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  visible,
  exercise,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Two Animated.Values for crossfade (frame 0 and frame 1)
  const opacity0 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;

  // useRef so the auto-cycle interval always reads the latest value
  const activeRef = useRef<0 | 1>(0);
  const [activeImage, setActiveImage] = useState<0 | 1>(0);

  const [img0Loading, setImg0Loading] = useState(true);
  const [img0Error, setImg0Error] = useState(false);
  const [img1Loading, setImg1Loading] = useState(true);
  const [img1Error, setImg1Error] = useState(false);

  const pausedUntilRef = useRef(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasEnd = (exercise?.images?.length ?? 0) > 1;

  // ── Crossfade helper ────────────────────────────────────────────────────────

  const crossfadeTo = useCallback(
    (idx: 0 | 1, userInitiated = false) => {
      if (activeRef.current === idx) return;

      if (userInitiated) {
        Haptics.selectionAsync();
        pausedUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
      }

      activeRef.current = idx;
      setActiveImage(idx);

      const fadeIn = idx === 0 ? opacity0 : opacity1;
      const fadeOut = idx === 0 ? opacity1 : opacity0;

      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [opacity0, opacity1]
  );

  // ── Auto-cycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!visible || !hasEnd) return;

    cycleRef.current = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;
      const next = (activeRef.current === 0 ? 1 : 0) as 0 | 1;
      crossfadeTo(next);
    }, AUTO_CYCLE_MS);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [visible, hasEnd, crossfadeTo]);

  // ── Reset on open/close ─────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      activeRef.current = 0;
      setActiveImage(0);
      setImg0Loading(true);
      setImg0Error(false);
      setImg1Loading(true);
      setImg1Error(false);
      pausedUntilRef.current = 0;
      opacity0.setValue(1);
      opacity1.setValue(0);
    }
  }, [visible, exercise?.id, opacity0, opacity1]);

  // ── Guard ───────────────────────────────────────────────────────────────────

  if (!exercise) return null;

  const img0 = exercise.images?.[0];
  const img1 = exercise.images?.[1];
  const hasImages = !!img0;

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      {/* Backdrop tap to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Sheet — inner Pressable absorbs touches so they don't reach backdrop */}
          <Pressable style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>

            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.exerciseName, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {exercise.name}
                </Text>
                {exercise.category && (
                  <Text
                    style={[styles.categoryLabel, { color: colors.textSecondary }]}
                  >
                    {cap(exercise.category)}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces>
              {/* ── Image area ───────────────────────────────────────────── */}
              {hasImages && (
                <View style={[styles.imageWrap, { backgroundColor: colors.card }]}>
                  {/* Frame 0 */}
                  {img0 && (
                    <Animated.View
                      style={[StyleSheet.absoluteFill, { opacity: opacity0 }]}
                    >
                      {img0Loading && !img0Error && (
                        <View style={styles.imageLoader}>
                          <ActivityIndicator color={colors.accentBlue} />
                        </View>
                      )}
                      {img0Error ? (
                        <View style={[styles.imageLoader, { backgroundColor: colors.card }]}>
                          <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                        </View>
                      ) : (
                        <Image
                          source={{ uri: img0 }}
                          style={styles.image}
                          resizeMode="contain"
                          onLoadStart={() => { setImg0Loading(true); setImg0Error(false); }}
                          onLoadEnd={() => setImg0Loading(false)}
                          onError={() => { setImg0Loading(false); setImg0Error(true); }}
                        />
                      )}
                    </Animated.View>
                  )}

                  {/* Frame 1 */}
                  {img1 && (
                    <Animated.View
                      style={[StyleSheet.absoluteFill, { opacity: opacity1 }]}
                    >
                      {img1Loading && !img1Error && (
                        <View style={styles.imageLoader}>
                          <ActivityIndicator color={colors.accentBlue} />
                        </View>
                      )}
                      {img1Error ? (
                        <View style={[styles.imageLoader, { backgroundColor: colors.card }]}>
                          <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                        </View>
                      ) : (
                        <Image
                          source={{ uri: img1 }}
                          style={styles.image}
                          resizeMode="contain"
                          onLoadStart={() => { setImg1Loading(true); setImg1Error(false); }}
                          onLoadEnd={() => setImg1Loading(false)}
                          onError={() => { setImg1Loading(false); setImg1Error(true); }}
                        />
                      )}
                    </Animated.View>
                  )}

                  {/* Start / End toggle + dot indicator */}
                  {hasEnd && (
                    <View style={styles.imageControls}>
                      {/* Toggle buttons */}
                      <View style={[styles.toggleRow, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                        <Pressable
                          style={[
                            styles.toggleBtn,
                            activeImage === 0 && styles.toggleBtnActive,
                          ]}
                          onPress={() => crossfadeTo(0, true)}
                        >
                          <Text
                            style={[
                              styles.toggleText,
                              { color: activeImage === 0 ? '#fff' : 'rgba(255,255,255,0.65)' },
                            ]}
                          >
                            Start
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.toggleBtn,
                            activeImage === 1 && styles.toggleBtnActive,
                          ]}
                          onPress={() => crossfadeTo(1, true)}
                        >
                          <Text
                            style={[
                              styles.toggleText,
                              { color: activeImage === 1 ? '#fff' : 'rgba(255,255,255,0.65)' },
                            ]}
                          >
                            End
                          </Text>
                        </Pressable>
                      </View>

                      {/* Dot indicator */}
                      <View style={styles.dots}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: activeImage === 0 ? '#fff' : 'rgba(255,255,255,0.35)' },
                          ]}
                        />
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: activeImage === 1 ? '#fff' : 'rgba(255,255,255,0.35)' },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ── Content ───────────────────────────────────────────────── */}
              <View style={styles.content}>

                {/* Metadata chips */}
                <View style={styles.chipsRow}>
                  {exercise.level && (
                    <View
                      style={[
                        styles.chip,
                        {
                          backgroundColor: `${LEVEL_COLORS[exercise.level]}20`,
                          borderColor: LEVEL_COLORS[exercise.level],
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: LEVEL_COLORS[exercise.level] }]}>
                        {cap(exercise.level)}
                      </Text>
                    </View>
                  )}
                  {exercise.force && (
                    <View
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Ionicons
                        name={(FORCE_ICONS[exercise.force] ?? 'fitness-outline') as any}
                        size={12}
                        color={colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                        {cap(exercise.force)}
                      </Text>
                    </View>
                  )}
                  {exercise.mechanic && (
                    <View
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                        {cap(exercise.mechanic)}
                      </Text>
                    </View>
                  )}
                  {exercise.equipment?.[0] && (
                    <View
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={12}
                        color={colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                        {cap(exercise.equipment[0])}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Primary muscles */}
                {(exercise.primaryMuscles?.length ?? 0) > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Primary Muscles
                    </Text>
                    <View style={styles.muscleRow}>
                      {exercise.primaryMuscles!.map((m) => (
                        <View
                          key={m}
                          style={[
                            styles.muscleChip,
                            {
                              backgroundColor: `${colors.accentBlue}18`,
                              borderColor: `${colors.accentBlue}60`,
                            },
                          ]}
                        >
                          <Text style={[styles.muscleText, { color: colors.accentBlue }]}>
                            {cap(m)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Secondary muscles */}
                {(exercise.secondaryMuscles?.length ?? 0) > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Secondary Muscles
                    </Text>
                    <View style={styles.muscleRow}>
                      {exercise.secondaryMuscles!.map((m) => (
                        <View
                          key={m}
                          style={[
                            styles.muscleChip,
                            { backgroundColor: colors.card, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.muscleText, { color: colors.textSecondary }]}>
                            {cap(m)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Instructions */}
                {(exercise.instructions?.length ?? 0) > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      How to perform
                    </Text>
                    {exercise.instructions!.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={[styles.stepNum, { backgroundColor: colors.accentBlue }]}>
                          <Text style={styles.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exerciseName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginBottom: 2 },
  categoryLabel: { fontSize: 13 },
  closeBtn: { padding: 4, marginLeft: 12 },

  // Image
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageControls: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText: { fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Content
  content: { padding: 20, gap: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },

  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  muscleText: { fontSize: 12, fontWeight: '500' },

  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
});
