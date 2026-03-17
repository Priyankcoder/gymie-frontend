/**
 * exerciseSync.ts
 *
 * Manages the exercise database sourced from:
 *   https://github.com/yuhonas/free-exercise-db  (public domain)
 *
 * Strategy:
 *   1. On first call, fetch all 238+ exercises from jsDelivr CDN and cache
 *      them in AsyncStorage.
 *   2. On subsequent calls, serve from cache instantly.
 *   3. Once a week, refresh in the background so the local DB stays current.
 *   4. If the cache version doesn't match (schema change), force a re-fetch.
 *   5. If network is unavailable and no cache exists, fall back to the
 *      bundled minimal set (FALLBACK_EXERCISES).
 *   6. On network failure, retry once before giving up.
 */

import { storage } from './localStorage';
import { ExerciseInfo } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXERCISE_DB_URL =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';

const CDN_IMAGE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

/** Re-fetch from CDN at most once per week. */
const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Bump this whenever the ExerciseInfo shape changes in a breaking way.
 * An old cache with a lower version will be discarded and re-fetched.
 */
const CACHE_VERSION = 2;

// ─── Raw DB Types ─────────────────────────────────────────────────────────────

/** Shape of a single exercise entry from free-exercise-db. */
export interface FreeExerciseDBItem {
  id: string;
  name: string;
  force: 'push' | 'pull' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// ─── Muscle → Body-Part Category Mapping ─────────────────────────────────────

const MUSCLE_TO_CATEGORY: Record<string, ExerciseInfo['category']> = {
  chest: 'chest',
  lats: 'back',
  'middle back': 'back',
  'lower back': 'back',
  traps: 'back',
  shoulders: 'shoulders',
  'rotator cuff': 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quadriceps: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  glutes: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  abdominals: 'core',
  obliques: 'core',
  neck: 'other',
};

function inferCategory(item: FreeExerciseDBItem): ExerciseInfo['category'] {
  if (item.category === 'cardio') return 'cardio';
  const primary = item.primaryMuscles[0] ?? '';
  return MUSCLE_TO_CATEGORY[primary] ?? 'other';
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapToExerciseInfo(item: FreeExerciseDBItem): ExerciseInfo {
  return {
    id: item.id,
    name: item.name,
    category: inferCategory(item),
    isCompound: item.mechanic === 'compound',
    muscleGroups: item.primaryMuscles,
    equipment: item.equipment ? [item.equipment] : [],
    level: item.level,
    force: item.force,
    mechanic: item.mechanic,
    primaryMuscles: item.primaryMuscles,
    secondaryMuscles: item.secondaryMuscles,
    instructions: item.instructions,
    images: item.images.map((p) => `${CDN_IMAGE_BASE}/${p}`),
  };
}

// ─── Sync Logic ───────────────────────────────────────────────────────────────

async function isCacheFresh(): Promise<boolean> {
  const version = await storage.get<number>(storage.keys.EXERCISES_VERSION);
  if (!version || version < CACHE_VERSION) return false;

  const lastSync = await storage.get<number>(storage.keys.EXERCISES_LAST_SYNC);
  if (!lastSync) return false;

  return Date.now() - lastSync <= SYNC_INTERVAL_MS;
}

async function fetchFromCDN(): Promise<FreeExerciseDBItem[]> {
  const response = await fetch(EXERCISE_DB_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchAndCache(): Promise<ExerciseInfo[]> {
  let raw: FreeExerciseDBItem[];

  try {
    raw = await fetchFromCDN();
  } catch {
    // One retry after a short delay
    await new Promise((r) => setTimeout(r, 1500));
    raw = await fetchFromCDN(); // throws on second failure — caller handles it
  }

  const exercises = raw.map(mapToExerciseInfo);
  await storage.set(storage.keys.EXERCISES, exercises);
  await storage.set(storage.keys.EXERCISES_LAST_SYNC, Date.now());
  await storage.set(storage.keys.EXERCISES_VERSION, CACHE_VERSION);
  return exercises;
}

/**
 * Main entry point.  Returns exercises immediately from cache when fresh;
 * otherwise fetches, caches, and returns.  Falls back to stale cache or
 * FALLBACK_EXERCISES when offline.
 */
export async function syncExercisesIfNeeded(): Promise<ExerciseInfo[]> {
  const cached = await storage.get<ExerciseInfo[]>(storage.keys.EXERCISES);
  const fresh = await isCacheFresh();

  if (fresh && cached && cached.length > 0) return cached;

  try {
    return await fetchAndCache();
  } catch (err) {
    console.warn('[exerciseSync] Fetch failed, using cache or fallback:', err);
    if (cached && cached.length > 0) return cached;
    return FALLBACK_EXERCISES;
  }
}

/** Returns currently cached exercises without triggering a sync. */
export async function getCachedExercises(): Promise<ExerciseInfo[]> {
  const cached = await storage.get<ExerciseInfo[]>(storage.keys.EXERCISES);
  return cached && cached.length > 0 ? cached : FALLBACK_EXERCISES;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const IMG = (id: string) => [
  `${CDN_IMAGE_BASE}/${id}/0.jpg`,
  `${CDN_IMAGE_BASE}/${id}/1.jpg`,
];

export const FALLBACK_EXERCISES: ExerciseInfo[] = [
  {
    id: 'Barbell_Bench_Press_-_Medium_Grip',
    name: 'Bench Press',
    category: 'chest',
    isCompound: true,
    muscleGroups: ['chest'],
    equipment: ['barbell'],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    images: IMG('Barbell_Bench_Press_-_Medium_Grip'),
    instructions: [
      'Lie back on a flat bench. Grip the bar just outside shoulder width.',
      'Lower the bar to your mid-chest.',
      'Press back to the starting position.',
    ],
  },
  {
    id: 'Barbell_Deadlift',
    name: 'Deadlift',
    category: 'back',
    isCompound: true,
    muscleGroups: ['lower back'],
    equipment: ['barbell'],
    level: 'intermediate',
    force: 'pull',
    mechanic: 'compound',
    primaryMuscles: ['lower back'],
    secondaryMuscles: ['glutes', 'hamstrings', 'lats'],
    images: IMG('Barbell_Deadlift'),
    instructions: [
      'Stand behind a loaded barbell, feet shoulder-width apart.',
      'Hinge at the hips and grip the bar.',
      'Drive through your heels and extend hips and knees to stand upright.',
    ],
  },
  {
    id: 'Barbell_Squat',
    name: 'Squat',
    category: 'legs',
    isCompound: true,
    muscleGroups: ['quadriceps'],
    equipment: ['barbell'],
    level: 'beginner',
    force: 'push',
    mechanic: 'compound',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['calves', 'glutes', 'hamstrings'],
    images: IMG('Barbell_Squat'),
    instructions: [
      'Bar rests on upper traps. Feet shoulder-width, toes slightly out.',
      'Descend until thighs are at least parallel to the floor.',
      'Drive through your heels to return to standing.',
    ],
  },
  {
    id: 'Barbell_Shoulder_Press',
    name: 'Overhead Press',
    category: 'shoulders',
    isCompound: true,
    muscleGroups: ['shoulders'],
    equipment: ['barbell'],
    level: 'intermediate',
    force: 'push',
    mechanic: 'compound',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    images: IMG('Barbell_Shoulder_Press'),
    instructions: [
      'Hold a barbell at shoulder height with an overhand grip.',
      'Press the bar overhead until arms are fully extended.',
      'Lower under control to the starting position.',
    ],
  },
  {
    id: 'Pullups',
    name: 'Pull Ups',
    category: 'back',
    isCompound: true,
    muscleGroups: ['lats'],
    equipment: ['body only'],
    level: 'beginner',
    force: 'pull',
    mechanic: 'compound',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps'],
    images: IMG('Pullups'),
    instructions: [
      'Hang from a bar with an overhand grip.',
      'Pull your chest toward the bar by driving elbows down.',
      'Lower back to a full hang.',
    ],
  },
];
