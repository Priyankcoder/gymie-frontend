
# Phase 3 & 4 Roadmap - Complete Guide

## Overview

This document provides step-by-step instructions to complete Phase 3 (Additional Screen Refactoring) and Phase 4 (Testing Infrastructure).

---

## 🎯 Phase 3: Additional Screen Refactoring

### Goal
Apply the same component decomposition pattern used in workout.tsx to nutrition, progress, and profile screens.

### Estimated Time: 2-3 hours

---

### Part 1: Refactor nutrition.tsx (~800 lines)

#### Step 1: Create Directory Structure
```bash
mkdir -p src/components/features/nutrition/{components,modals}
mkdir -p src/hooks/nutrition
```

#### Step 2: Extract Components

**1. NutritionSummaryCard.tsx**
```typescript
// Display daily macro totals with ring/bar visualization
// Props: calories, protein, carbs, fat, goals
// Location: src/components/features/nutrition/components/
```

**2. MealTypeSection.tsx**
```typescript
// Display meals for a specific meal type (breakfast, lunch, etc.)
// Props: mealType, meals, onAddMeal, onDeleteMeal
// Location: src/components/features/nutrition/components/
```

**3. MealCard.tsx**
```typescript
// Individual meal display with macros
// Props: meal, onDelete, onEdit
// Location: src/components/features/nutrition/components/
```

**4. AIUploadCard.tsx**
```typescript
// Card with camera/gallery upload buttons
// Props: onTakePhoto, onPickPhoto
// Location: src/components/features/nutrition/components/
```

**5. RecipeCard.tsx**
```typescript
// Recipe display with ingredients and macros
// Props: recipe, onSelect
// Location: src/components/features/nutrition/components/
```

#### Step 3: Extract Modals

**1. AIEstimationModal.tsx**
```typescript
// Modal showing AI-estimated macros from photo
// Props: visible, image, estimation, isLoading, onClose, onSave, onEdit
// Location: src/components/features/nutrition/modals/
```

**2. AddMealModal.tsx**
```typescript
// Manual meal entry modal
// Props: visible, mealType, onClose, onSave
// Location: src/components/features/nutrition/modals/
```

**3. RecipeGeneratorModal.tsx**
```typescript
// Recipe generator from ingredients
// Props: visible, onClose, recipes, isGenerating, onGenerate
// Location: src/components/features/nutrition/modals/
```

#### Step 4: Create Hooks

**useNutritionData.ts**
```typescript
export const useNutritionData = () => {
  // Fetch meals, preferences
  // Calculate totals
  // Provide refetch
  
  return {
    todayMeals,
    nutritionTotals,
    preferences,
    loading,
    error,
    refetch,
  };
};
```

**useAIEstimation.ts**
```typescript
export const useAIEstimation = () => {
  // Handle photo selection
  // Call AI estimation API
  // Manage loading state
  
  return {
    estimateMeal,
    isEstimating,
    error,
  };
};
```

#### Step 5: Update nutrition.tsx
```typescript
import { useNutritionData } from '@/src/hooks/nutrition/useNutritionData';
import {
  NutritionSummaryCard,
  MealTypeSection,
  AIUploadCard,
} from '@/src/components/features/nutrition/components';
import {
  AIEstimationModal,
  AddMealModal,
  RecipeGeneratorModal,
} from '@/src/components/features/nutrition/modals';

// Use components instead of inline JSX
```

---

### Part 2: Refactor progress.tsx (~1,000 lines)

#### Step 1: Create Directory Structure
```bash
mkdir -p src/components/features/progress/{components,modals}
mkdir -p src/hooks/progress
```

#### Step 2: Extract Components

**1. ExerciseProgressChart.tsx**
```typescript
// Line chart for exercise progress over time
// Props: exerciseName, data, metric, dateRange
// Location: src/components/features/progress/components/
```

**2. WeightProgressChart.tsx**
```typescript
// Line chart for body weight tracking
// Props: weightLogs, dateRange, unit
// Location: src/components/features/progress/components/
```

**3. ExerciseStatsCard.tsx**
```typescript
// Stats card showing max weight, volume, etc.
// Props: exercise, stats, trend
// Location: src/components/features/progress/components/
```

**4. PhotoGallery.tsx**
```typescript
// Grid of progress photos grouped by month
// Props: photos, compareMode, selectedPhotos, onSelectPhoto
// Location: src/components/features/progress/components/
```

**5. PhotoCompareView.tsx**
```typescript
// Side-by-side photo comparison
// Props: photo1, photo2, onClose
// Location: src/components/features/progress/components/
```

**6. DateRangeSelector.tsx**
```typescript
// Tab selector for date ranges (1W, 1M, 3M, etc.)
// Props: selected, options, onSelect
// Location: src/components/features/progress/components/
```

**7. MetricSelector.tsx**
```typescript
// Tab selector for metrics (weight, reps, volume, 1RM)
// Props: selected, options, onSelect
// Location: src/components/features/progress/components/
```

#### Step 3: Extract Modals

**1. ExercisePickerModal.tsx** (reuse from workout)
```typescript
// Can reuse: src/components/features/workout/modals/ExercisePickerModal.tsx
```

**2. AddWeightModal.tsx**
```typescript
// Modal for logging body weight
// Props: visible, onClose, onSave, unit
// Location: src/components/features/progress/modals/
```

#### Step 4: Create Hooks

**useProgressData.ts**
```typescript
export const useProgressData = () => {
  // Fetch workouts, weight logs, photos
  // Calculate exercise stats
  // Filter by date range
  
  return {
    workouts,
    weightLogs,
    progressPhotos,
    exerciseStats,
    loading,
    error,
    refetch,
  };
};
```

**usePhotoGallery.ts**
```typescript
export const usePhotoGallery = () => {
  // Handle photo selection
  // Compare mode logic
  // Photo upload/delete
  
  return {
    compareMode,
    selectedPhotos,
    toggleCompareMode,
    selectPhoto,
    addPhoto,
    deletePhoto,
  };
};
```

#### Step 5: Update progress.tsx
```typescript
import { useProgressData, usePhotoGallery } from '@/src/hooks/progress';
import {
  ExerciseProgressChart,
  WeightProgressChart,
  PhotoGallery,
} from '@/src/components/features/progress/components';

// Use components instead of inline JSX
```

---

### Part 3: Refactor profile.tsx (~400 lines)

#### Step 1: Create Directory Structure
```bash
mkdir -p src/components/features/profile/components
```

#### Step 2: Extract Components

**1. ProfileStatsCard.tsx**
```typescript
// Stats summary (streak, total workouts, this month)
// Props: streakData
// Location: src/components/features/profile/components/
```

**2. BodyStatsSection.tsx**
```typescript
// Body measurements (weight, height, BMI)
// Props: weight, height, bmi, unit, onEdit
// Location: src/components/features/profile/components/
```

**3. SettingsSection.tsx**
```typescript
// Settings group (theme, units, etc.)
// Props: title, settings
// Location: src/components/features/profile/components/
```

**4. SettingItem.tsx**
```typescript
// Individual setting row
// Props: label, value, type (toggle/select/text), onChange
// Location: src/components/features/profile/components/
```

**5. GoalsSection.tsx**
```typescript
// Daily goals (calories, macros, steps)
// Props: goals, onEditGoal
// Location: src/components/features/profile/components/
```

#### Step 3: Use Global State

**Update profile.tsx to use useAppData**
```typescript
import { useAppData } from '@/src/contexts/AppDataContext';

// Remove local preferences fetching
const { preferences, updatePreferences } = useAppData();

// Simplify preference updates
await updatePreferences({ theme: 'dark' });
```

#### Step 4: Update profile.tsx
```typescript
import { useAppData } from '@/src/contexts/AppDataContext';
import {
  ProfileStatsCard,
  BodyStatsSection,
  SettingsSection,
  GoalsSection,
} from '@/src/components/features/profile/components';

// Use components and global state
```

---

## 🧪 Phase 4: Testing Infrastructure

### Goal
Set up comprehensive testing with Jest and React Native Testing Library

### Estimated Time: 4-5 hours

---

### Part 1: Setup Testing Environment

#### Step 1: Install Dependencies
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest
```

#### Step 2: Configure Jest

**Create jest.config.js:**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

#### Step 3: Update package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

### Part 2: Write Utility Tests

#### Test: src/utils/date.test.ts
```typescript
import {
  formatDate,
  getTodayString,
  getGreeting,
  formatTime,
  isToday,
} from '../date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-12-18');
      expect(formatDate(date)).toMatch(/December|Dec/);
    });
  });

  describe('getTodayString', () => {
    it('returns ISO date string', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getGreeting', () => {
    it('returns Good Morning before noon', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      expect(getGreeting()).toBe('Good Morning');
    });

    it('returns Good Afternoon in afternoon', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      expect(getGreeting()).toBe('Good Afternoon');
    });

    it('returns Good Evening after 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(19);
      expect(getGreeting()).toBe('Good Evening');
    });
  });

  describe('formatTime', () => {
    it('formats milliseconds correctly', () => {
      expect(formatTime(0)).toBe('00:00.00');
      expect(formatTime(1500)).toBe('00:01.50');
      expect(formatTime(61500)).toBe('01:01.50');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isToday(today)).toBe(true);
    });

    it('returns false for other dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });
  });
});
```

#### Test: src/utils/calculations.test.ts
```typescript
import {
  calculateOneRepMax,
  calculateWorkoutVolume,
  calculateBMI,
  getBMICategory,
  convertWeight,
} from '../calculations';

describe('Calculation Utilities', () => {
  describe('calculateOneRepMax', () => {
    it('returns weight for 1 rep', () => {
      expect(calculateOneRepMax(100, 1)).toBe(100);
    });

    it('calculates 1RM correctly', () => {
      expect(calculateOneRepMax(100, 5)).toBe(117);
      expect(calculateOneRepMax(100, 10)).toBe(133);
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      const bmi = calculateBMI(70, 175);
      expect(bmi).toBeCloseTo(22.86, 2);
    });
  });

  describe('getBMICategory', () => {
    it('returns correct categories', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(22)).toBe('Normal');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(32)).toBe('Obese');
    });
  });

  describe('convertWeight', () => {
    it('converts kg to lb', () => {
      expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.46, 2);
    });

    it('converts lb to kg', () => {
      expect(convertWeight(220, 'lb', 'kg')).toBeCloseTo(99.79, 2);
    });

    it('returns same value for same unit', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100);
    });
  });
});
```

---

### Part 3: Write Hook Tests

#### Test: src/hooks/useModalManager.test.ts
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useModalManager } from '../useModalManager';

describe('useModalManager', () => {
  it('initializes with no active modal', () => {
    const { result } = renderHook(() => useModalManager());
    expect(result.current.activeModal).toBeNull();
  });

  it('opens modal correctly', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    
    expect(result.current.activeModal).toBe('exercise');
    expect(result.current.isOpen('exercise')).toBe(true);
  });

  it('closes modal correctly', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
      result.current.closeModal();
    });
    
    expect(result.current.activeModal).toBeNull();
  });

  it('handles modal data', () => {
    const { result } = renderHook(() => useModalManager());
    const testData = { test: 'value' };
    
    act(() => {
      result.current.openModal('exercise', testData);
    });
    
    expect(result.current.modalData).toEqual(testData);
  });
});
```

---

### Part 4: Write Component Tests

#### Test: src/components/features/workout/components/SetRow.test.tsx
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SetRow } from '../SetRow';
import { ThemeProvider } from '../../../../../contexts/ThemeContext';

const mockSet = {
  id: '1',
  reps: 10,
  weight: 100,
  completed: false,
};

const wrapper = ({ children }: any) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('SetRow', () => {
  it('renders correctly', () => {
    const { getByDisplayValue } = render(
      <SetRow
        set={mockSet}
        setIndex={0}
        onUpdateSet={jest.fn()}
        onRemoveSet={jest.fn()}
        onCompleteSet={jest.fn()}
        canRemove={true}
      />,
      { wrapper }
    );

    expect(getByDisplayValue('100')).toBeTruthy();
    expect(getByDisplayValue('10')).toBeTruthy();
  });

  it('calls onCompleteSet when check button pressed', () => {
    const onCompleteSet = jest.fn();
    const { getByTestId } = render(
      <SetRow
        set={mockSet}
        setIndex={0}
        onUpdateSet={jest.fn()}
        onRemoveSet={jest.fn()}
        onCompleteSet={onCompleteSet}
        canRemove={true}
      />,
      { wrapper }
    );

    // Add testID to check button in component
    fireEvent.press(getByTestId('check-button'));
    expect(onCompleteSet).toHaveBeenCalledWith('1');
  });

  it('disables inputs when completed', () => {
    const completedSet = { ...mockSet, completed: true };
    const { getByDisplayValue } = render(
      <SetRow
        set={completedSet}
        setIndex={0}
        onUpdateSet={jest.fn()}
        onRemoveSet={jest.fn()}
        onCompleteSet={jest.fn()}
        canRemove={true}
      />,
      { wrapper }
    );

    const weightInput = getByDisplayValue('100');
    expect(weightInput.props.editable).toBe(false);
  });
});
```

---

### Part 5: Write Integration Tests

#### Test: src/hooks/useWorkoutData.test.ts (Integration)
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useWorkoutData } from '../useWorkoutData';
import { localApi } from '../../services/localApi';

jest.mock('../../services/localApi');

describe('useWorkoutData Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads workout data on mount', async () => {
    const mockWorkouts = [{ id: '1', name: 'Test Workout' }];
    (localApi.workouts.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockWorkouts,
    });

    const { result } = renderHook(() => useWorkoutData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workouts).toEqual(mockWorkouts);
  });

  it('handles errors gracefully', async () => {
    (localApi.workouts.getAll as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useWorkoutData());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

### Part 6: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- date.test.ts
```

---

## 📊 Success Metrics

### Phase 3 Completion Criteria
- [ ] nutrition.tsx reduced by 50%+
- [ ] progress.tsx reduced by 50%+
- [ ] profile.tsx uses global state
- [ ] All components extracted
- [ ] All functionality preserved
- [ ] Zero breaking changes

### Phase 4 Completion Criteria
- [ ] Jest configured
- [ ] 80%+ test coverage for utilities
- [ ] All hooks tested
- [ ] Key components tested
- [ ] Integration tests passing
- [ ] CI-ready test suite

---

## 🎯 Timeline

**Phase 3**: 2-3 hours
- nutrition.tsx: 1 hour
- progress.tsx: 1-1.5 hours
- profile.tsx: 30 minutes

**Phase 4**: 4-5 hours
- Setup: 30 minutes
- Utility tests: 1 hour
- Hook tests: 1 hour
- Component tests: 1.5-2 hours
- Integration tests: 1 hour

**Total**: 6-8 hours

---

## 📝 Tips

### For Phase 3:
1. Follow the same pattern as workout.tsx
2. Extract smallest components first
3. Test after each extraction
4. Use TypeScript strictly
5. Reuse components where possible

### For Phase 4:
1. Start with utility tests (easiest)
2. Mock external dependencies
3. Test behavior, not implementation
4. Aim for high coverage on critical paths
5. Use descriptive test names

---

## 🚀 Next Steps

1. Start with nutrition.tsx (Part 1)
2. Move to progress.tsx (Part 2)
3. Finish with profile.tsx (Part 3)
4. Set up testing environment (Part 4.1)
5. Write tests incrementally (Part 4.2-4.6)

---

*Good luck with Phase 3 & 4! Follow this roadmap step-by-step for best results.* 🎉
