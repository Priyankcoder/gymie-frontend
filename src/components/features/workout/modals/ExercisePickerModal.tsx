/**
 * ExercisePickerModal
 *
 * Production-ready exercise picker with:
 *  - Category filter pills
 *  - Debounced multi-field search (name, muscles, equipment)
 *  - Per-item stagger + press-scale microinteractions
 *  - Shimmer skeleton while exercises load
 *  - Haptics on every meaningful interaction
 *  - Drill-down to ExerciseDetailModal via info button
 */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ExerciseInfo } from '../../../../types';
import { ExerciseDetailModal } from './ExerciseDetailModal';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { key: ExerciseInfo['category'] | 'all'; label: string }[] =
  [
    { key: 'all', label: 'All' },
    { key: 'chest', label: 'Chest' },
    { key: 'back', label: 'Back' },
    { key: 'legs', label: 'Legs' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'arms', label: 'Arms' },
    { key: 'core', label: 'Core' },
    { key: 'cardio', label: 'Cardio' },
    { key: 'other', label: 'Other' },
  ];

type CategoryKey = (typeof CATEGORIES)[number]['key'];

// ─── Level colors ─────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#22C55E',
  intermediate: '#F59E0B',
  expert: '#EF4444',
};

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

const SkeletonItem = memo(({ colors }: { colors: any }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={[skeletonStyles.row, { borderBottomColor: colors.border }]}>
      <Animated.View
        style={[
          skeletonStyles.thumb,
          { backgroundColor: colors.inputBackground, opacity: pulse },
        ]}
      />
      <View style={{ flex: 1, gap: 7 }}>
        <Animated.View
          style={[
            skeletonStyles.line,
            {
              width: '58%',
              backgroundColor: colors.inputBackground,
              opacity: pulse,
            },
          ]}
        />
        <Animated.View
          style={[
            skeletonStyles.line,
            {
              width: '36%',
              backgroundColor: colors.inputBackground,
              opacity: pulse,
            },
          ]}
        />
      </View>
    </View>
  );
});

const skeletonStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  line: { height: 11, borderRadius: 6 },
});

// ─── Single exercise row ──────────────────────────────────────────────────────

interface RowProps {
  item: ExerciseInfo;
  index: number;
  onSelect: (ex: ExerciseInfo) => void;
  onInfo: (ex: ExerciseInfo) => void;
}

const ExerciseRow = memo(({ item, index, onSelect, onInfo }: RowProps) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const delay = Math.min(index * 22, 220);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        speed: 16,
        bounciness: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 50,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 18,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handleSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item);
  }, [item, onSelect]);

  const handleInfo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onInfo(item);
  }, [item, onInfo]);

  const levelColor = item.level ? LEVEL_COLORS[item.level] : undefined;

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ scale }, { translateY }] }}
    >
      <Pressable
        style={[rowStyles.row, { borderBottomColor: colors.border }]}
        onPress={handleSelect}
        onPressIn={pressIn}
        onPressOut={pressOut}
        android_ripple={{ color: `${colors.accentBlue}18` }}
      >
        {/* Thumbnail */}
        {item.images?.[0] ? (
          <Image
            source={{ uri: item.images[0] }}
            style={[
              rowStyles.thumb,
              { backgroundColor: colors.inputBackground },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              rowStyles.thumb,
              {
                backgroundColor: colors.inputBackground,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Ionicons
              name="barbell-outline"
              size={22}
              color={colors.textSecondary}
            />
          </View>
        )}

        {/* Text */}
        <View style={rowStyles.textBlock}>
          <Text
            style={[rowStyles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={rowStyles.metaRow}>
            <Text
              style={[rowStyles.metaText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.category}
            </Text>
            {levelColor && (
              <>
                <View
                  style={[
                    rowStyles.dot,
                    { backgroundColor: colors.textSecondary },
                  ]}
                />
                <Text style={[rowStyles.metaText, { color: levelColor }]}>
                  {item.level}
                </Text>
              </>
            )}
            {item.equipment?.[0] && (
              <>
                <View
                  style={[
                    rowStyles.dot,
                    { backgroundColor: colors.textSecondary },
                  ]}
                />
                <Text
                  style={[rowStyles.metaText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.equipment[0]}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Info button — nested Pressable, won't bubble to row */}
        <Pressable onPress={handleInfo} style={rowStyles.infoBtn} hitSlop={10}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Add indicator */}
        <View
          style={[
            rowStyles.addBadge,
            { backgroundColor: `${colors.accentBlue}15` },
          ]}
        >
          <Ionicons name="add" size={18} color={colors.accentBlue} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10, flexShrink: 0 },
  textBlock: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  metaText: { fontSize: 12, textTransform: 'capitalize' },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  infoBtn: { padding: 6 },
  addBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: ExerciseInfo[];
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseInfo) => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  exercises,
  onClose,
  onSelectExercise,
}) => {
  const { colors, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();

  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [detailExercise, setDetailExercise] = useState<ExerciseInfo | null>(
    null
  );
  const [listKey, setListKey] = useState('initial');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setRawQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(text), 250);
  }, []);

  const handleCategorySelect = useCallback((key: CategoryKey) => {
    Haptics.selectionAsync();
    setActiveCategory(key);
    setListKey(key + '_' + Date.now());
  }, []);

  const handleSelect = useCallback(
    (ex: ExerciseInfo) => {
      onSelectExercise(ex);
      setRawQuery('');
      setQuery('');
      setActiveCategory('all');
    },
    [onSelectExercise]
  );

  const handleClose = useCallback(() => {
    setRawQuery('');
    setQuery('');
    setActiveCategory('all');
    onClose();
  }, [onClose]);

  const handleInfo = useCallback((ex: ExerciseInfo) => {
    setDetailExercise(ex);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return exercises.filter((ex) => {
      const matchesCat =
        activeCategory === 'all' || ex.category === activeCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.primaryMuscles?.some((m) => m.toLowerCase().includes(q)) ||
        ex.equipment?.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [exercises, query, activeCategory]);

  const isLoading = exercises.length === 0;

  const renderItem = useCallback(
    ({ item, index }: { item: ExerciseInfo; index: number }) => (
      <ExerciseRow
        item={item}
        index={index}
        onSelect={handleSelect}
        onInfo={handleInfo}
      />
    ),
    [handleSelect, handleInfo]
  );

  const keyExtractor = useCallback((item: ExerciseInfo) => item.id, []);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonItem key={i} colors={colors} />
          ))}
        </>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="search-outline"
          size={44}
          color={colors.textSecondary}
          style={{ marginBottom: 12, opacity: 0.5 }}
        />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          No exercises found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Try a different keyword or category
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: colors.border }]}
          >
            <View>
              <Text
                style={[styles.headerTitle, { color: colors.textPrimary }]}
              >
                Add Exercise
              </Text>
              {!isLoading && (
                <Text
                  style={[
                    styles.headerCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {filtered.length === exercises.length
                    ? `${exercises.length} exercises`
                    : `${filtered.length} of ${exercises.length}`}
                </Text>
              )}
            </View>
            <Pressable
              onPress={handleClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.inputBackground },
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={17} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.inputBackground,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={17}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={rawQuery}
              onChangeText={handleQueryChange}
              placeholder="Name, muscle, equipment…"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
            />
            {rawQuery.length > 0 && (
              <Pressable onPress={() => handleQueryChange('')} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
            style={styles.pillsScroll}
          >
            {CATEGORIES.map(({ key, label }) => {
              const active = activeCategory === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: colors.accentBlue }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => handleCategorySelect(key)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Exercise list */}
          <FlatList
            key={listKey}
            data={isLoading ? [] : filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={ListEmpty}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={12}
            initialNumToRender={12}
            windowSize={8}
          />
        </View>
      </View>

      {/* Detail modal stacks on top of everything */}
      <ExerciseDetailModal
        visible={detailExercise !== null}
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '86%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  headerCount: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  pillsScroll: { maxHeight: 46, marginTop: 10 },
  pillsContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 2,
  },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '600' },
  list: { flex: 1, marginTop: 6 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
