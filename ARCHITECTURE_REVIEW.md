
# 🏗️ Gymie - Frontend Architecture Review & Refactoring Roadmap

## Executive Summary

This document provides a comprehensive architectural analysis of the Gymie fitness app, identifying critical areas for refactoring to improve maintainability, scalability, and code quality.

**Current State:** Working prototype with good feature coverage
**Target State:** Production-ready, maintainable, and scalable application

---

## 🔴 Critical Issues (High Priority)

### 1. **Massive Monolithic Components**

**Problem:**
- `app/(tabs)/workout.tsx`: **2,975 lines** - Extremely difficult to maintain
- `app/(tabs)/progress.tsx`: **~1,000 lines**
- `app/(tabs)/nutrition.tsx`: **~800 lines**

**Impact:**
- Hard to debug and test
- Difficult for team collaboration
- High cognitive load
- Poor code reusability

**Solution:**
```
app/(tabs)/workout/
├── WorkoutScreen.tsx (main container, ~150 lines)
├── components/
│   ├── ActiveWorkoutView.tsx
│   ├── WorkoutHistory.tsx
│   ├── WorkoutPlansView.tsx
│   ├── modals/
│   │   ├── ExercisePickerModal.tsx
│   │   ├── TemplateModal.tsx
│   │   ├── PlanCustomizationModal.tsx
│   │   ├── RestTimerModal.tsx
│   │   └── CalendarModal.tsx
│   └── cards/
│       ├── ExerciseCard.tsx
│       ├── SetRow.tsx
│       └── WorkoutPlanCard.tsx
├── hooks/
│   ├── useWorkoutManager.ts
│   ├── usePlanCustomization.ts
│   └── useRestTimer.ts
└── utils/
    ├── workoutCalculations.ts
    └── planScheduling.ts
```

### 2. **No Custom Hooks - Business Logic in Components**

**Problem:**
```typescript
// Current: All in component
const [workouts, setWorkouts] = useState<Workout[]>([]);
const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
// ... 20+ more useState declarations

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  const [workoutsRes, prsRes, ...] = await Promise.all([...]);
  // Complex data transformation logic
};
```

**Solution:**
```typescript
// hooks/useWorkoutData.ts
export const useWorkoutData = () => {
  const [data, setData] = useState<WorkoutData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await fetchWorkoutData();
      setData(results);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useRefreshOnFocus(loadData);

  return { data, loading, error, refetch: loadData };
};

// Usage in component
const { data, loading, error, refetch } = useWorkoutData();
```

**Required Custom Hooks:**
- `useWorkoutData()` - Data fetching and state
- `useWorkoutManager()` - Active workout CRUD operations
- `usePlanCustomization()` - Plan editing logic
- `useRestTimer()` - Rest timer management
- `useNutritionTracking()` - Meal tracking
- `useProgressTracking()` - Progress photos and charts
- `useExerciseSearch()` - Exercise filtering
- `useModalManager()` - Modal state management
- `useRefreshOnFocus()` - Refresh data on screen focus

### 3. **No Global State Management**

**Problem:**
- User preferences fetched in every screen
- No shared state for workouts, meals, or PRs
- Prop drilling through component tree
- Inconsistent data across screens

**Solution:**

```typescript
// contexts/AppDataContext.tsx
interface AppDataContextType {
  preferences: UserPreferences | null;
  workouts: Workout[];
  meals: Meal[];
  personalRecords: PersonalRecord[];
  streakData: StreakData | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

export const AppDataProvider: React.FC = ({ children }) => {
  // Centralized data management
  // Cache invalidation strategies
  // Optimistic updates
};

// Usage
const { workouts, meals, refetch } = useAppData();
```

**Recommended State Management Strategy:**
1. **Context + Hooks** for simple global state (start here)
2. Consider **Zustand** if complexity grows (lightweight, ~1KB)
3. Avoid Redux (overkill for this app)

### 4. **Modal State Management Chaos**

**Problem:**
```typescript
// 10+ boolean states for modals
const [showExerciseModal, setShowExerciseModal] = useState(false);
const [showRestTimer, setShowRestTimer] = useState(false);
const [showTemplateModal, setShowTemplateModal] = useState(false);
const [showPrebuiltPlansModal, setShowPrebuiltPlansModal] = useState(false);
const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);
// ... 5 more
```

**Solution:**
```typescript
// hooks/useModalManager.ts
type ModalType = 'exercise' | 'rest' | 'template' | 'plan' | null;

export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = useCallback((type: ModalType, data?: any) => {
    setActiveModal(type);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    isOpen: (type: ModalType) => activeModal === type,
  };
};

// Usage
const { openModal, closeModal, isOpen } = useModalManager();
<Modal visible={isOpen('exercise')} />
```

---

## 🟡 Important Issues (Medium Priority)

### 5. **No Error Handling & Loading States**

**Problem:**
```typescript
const loadData = async () => {
  const [workoutsRes] = await Promise.all([...]);
  if (workoutsRes.data) setWorkouts(workoutsRes.data);
  // No loading state, no error handling, no retry logic
};
```

**Solution:**
```typescript
// hooks/useAsyncData.ts
export const useAsyncData = <T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  deps: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err as Error);
      // Log to error tracking service
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
```

### 6. **Repetitive API Calls Pattern**

**Problem:**
- Every component repeats the same data fetching pattern
- No caching or optimization
- No request deduplication

**Solution:**
```typescript
// services/api/workoutsApi.ts
export const workoutsApi = {
  useWorkouts: () => {
    return useAsyncData(
      () => localApi.workouts.getAll(),
      []
    );
  },
  
  useWorkout: (id: string) => {
    return useAsyncData(
      () => localApi.workouts.getById(id),
      [id]
    );
  },

  useMutateWorkout: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: localApi.workouts.create,
      onSuccess: () => {
        queryClient.invalidateQueries(['workouts']);
      },
    });
  },
};

// Or implement simple cache layer
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}
```

### 7. **Utility Functions Missing**

**Problem:**
- Date formatting repeated everywhere
- Calculation logic inline in components
- No helper functions for common operations

**Solution:**
```
src/utils/
├── date.ts
│   ├── formatDate()
│   ├── getDaysBetween()
│   └── isToday()
├── calculations.ts
│   ├── calculateOneRepMax()
│   ├── calculateVolume()
│   └── calculateMacroPercentage()
├── validation.ts
│   ├── validateWeight()
│   ├── validateReps()
│   └── validateMacros()
└── formatting.ts
    ├── formatNumber()
    ├── formatTime()
    └── formatDuration()
```

### 8. **Type Safety Issues**

**Problem:**
```typescript
// Weak typing
const [modalData, setModalData] = useState<any>(null);

// No discriminated unions for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Solution:**
```typescript
// Strong discriminated unions
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Modal data types
type ModalData =
  | { type: 'exercise'; exercise: ExerciseInfo }
  | { type: 'plan'; plan: WorkoutPlan }
  | { type: 'rest'; duration: number }
  | null;

// Exhaustive pattern matching
function handleModalData(data: ModalData) {
  if (!data) return null;
  
  switch (data.type) {
    case 'exercise':
      return <ExerciseModal exercise={data.exercise} />;
    case 'plan':
      return <PlanModal plan={data.plan} />;
    case 'rest':
      return <RestTimerModal duration={data.duration} />;
    default:
      const _exhaustive: never = data; // Type error if not exhaustive
      return null;
  }
}
```

---

## 🟢 Enhancements (Nice to Have)

### 9. **Component Library Organization**

**Current:**
```
src/components/ui/
├── Button.tsx
├── Card.tsx
├── ... (8 files)
```

**Recommended:**
```
src/components/
├── ui/                    # Base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Card/
│   ├── Input/
│   └── Modal/
├── features/              # Feature-specific components
│   ├── workout/
│   │   ├── ExerciseCard/
│   │   ├── SetRow/
│   │   └── RestTimer/
│   ├── nutrition/
│   └── progress/
└── layouts/               # Layout components
    ├── Screen/
    ├── TabBar/
    └── Header/
```

### 10. **Performance Optimizations**

**Recommendations:**
```typescript
// 1. Memoize expensive calculations
const volumeStats = useMemo(() => 
  calculateVolumeStats(workouts),
  [workouts]
);

// 2. Virtualized lists for large datasets
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={workouts}
  renderItem={renderWorkout}
  estimatedItemSize={100}
/>

// 3. Lazy load modals
const ExerciseModal = React.lazy(() => 
  import('./modals/ExerciseModal')
);

// 4. Debounce search inputs
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 11. **Testing Infrastructure**

**Required Setup:**
```typescript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};

// Example test
// components/ui/Button/Button.test.tsx
describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test" onPress={jest.fn()} />
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={onPress} />
    );
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### 12. **Form Management**

**Problem:**
- Manual form state management
- No validation library
- Repetitive input handling

**Solution:**
```typescript
// Use React Hook Form
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const mealSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
});

type MealFormData = z.infer<typeof mealSchema>;

const MealForm = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
  });

  const onSubmit = (data: MealFormData) => {
    // Type-safe, validated data
  };

  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <TextInput
          value={field.value}
          onChangeText={field.onChange}
          error={errors.name?.message}
        />
      )}
    />
  );
};
```

---

## 📋 Refactoring Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Extract custom hooks from workout screen
- [ ] Create utility functions library
- [ ] Set up global state with Context API
- [ ] Implement error boundaries
- [ ] Add loading states to all data fetches

### Phase 2: Component Decomposition (Week 3-4)
- [ ] Break down workout.tsx into smaller components
- [ ] Refactor progress.tsx
- [ ] Refactor nutrition.tsx
- [ ] Create shared modal manager
- [ ] Extract calculation logic to utils

### Phase 3: Architecture Improvements (Week 5-6)
- [ ] Implement data caching layer
- [ ] Add request deduplication
- [ ] Set up proper TypeScript discriminated unions
- [ ] Create feature-based folder structure
- [ ] Add form validation library

### Phase 4: Testing & Performance (Week 7-8)
- [ ] Set up Jest and React Native Testing Library
- [ ] Write unit tests for utilities
- [ ] Write integration tests for hooks
- [ ] Add component tests
- [ ] Implement virtualized lists
- [ ] Add React.memo where needed

---

## 🎯 Recommended Folder Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── features/              # Feature-specific components
│   └── layouts/               # Layout components
├── contexts/                  # React contexts
│   ├── AppDataContext.tsx
│   ├── ThemeContext.tsx
│   └── AuthContext.tsx
├── hooks/                     # Custom hooks
│   ├── useWorkoutData.ts
│   ├── useWorkoutManager.ts
│   ├── useModalManager.ts
│   ├── useAsyncData.ts
│   └── useDebounce.ts
├── services/                  # API and external services
│   ├── api/
│   │   ├── workoutsApi.ts
│   │   ├── mealsApi.ts
│   │   └── index.ts
│   ├── localApi.ts
│   └── localStorage.ts
├── utils/                     # Utility functions
│   ├── date.ts
│   ├── calculations.ts
│   ├── validation.ts
│   └── formatting.ts
├── types/                     # TypeScript types
│   ├── index.ts
│   ├── workout.types.ts
│   ├── nutrition.types.ts
│   └── api.types.ts
├── constants/                 # Constants and config
│   ├── theme.ts
│   ├── config.ts
│   └── exercises.ts
└── data/                      # Static data
    ├── prebuiltPlans.ts
    └── seedData.ts
```

---

## 🔧 Recommended Dependencies

### Add:
```json
{
  "dependencies": {
    "zustand": "^5.0.3",              // If Context becomes insufficient
    "react-hook-form": "^7.54.2",     // Form management
    "zod": "^3.25.1",                 // Schema validation
    "@shopify/flash-list": "^1.8.0", // Performant lists
    "date-fns": "^4.1.0"              // Date utilities
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.9.0",
    "@testing-library/jest-native": "^5.4.3",
    "jest": "^29.7.0"
  }
}
```

---

## 📊 Metrics & Goals

### Current State:
- Average component size: **~500 lines**
- Largest component: **2,975 lines** ❌
- Test coverage: **0%** ❌
- Reusable hooks: **0** ❌
- Performance score: **Unknown**

### Target State:
- Average component size: **<200 lines** ✅
- Largest component: **<300 lines** ✅
- Test coverage: **>70%** ✅
- Reusable hooks: **10+** ✅
- Performance score: **>90** ✅

---

## 🚀 Quick Wins (Start Here)

1. **Extract `useWorkoutData` hook** (2 hours)
2. **Create `useModalManager` hook** (1 hour)
3. **Add utility functions for date/time** (1 hour)
4. **Break workout.tsx into 3 files** (4 hours)
5. **Add error boundaries** (1 hour)

**Total: 1 day of work for significant improvements**

---

## 📚 References

- [React Hooks Best Practices](https://react.dev/reference/react)
- [Expo Performance Guide](https://docs.expo.dev/guides/performance/)
- [TypeScript Best Practices](https://typescript.tv/best-practices/)
- [Testing React Native](https://reactnative.dev/docs/testing-overview)

---

*Generated on: December 18, 2025*
*Reviewed by: Frontend Architect AI*
