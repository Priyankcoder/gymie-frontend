
# Frontend Documentation

Documentation for the Gymie React Native mobile application.

## API Integration

### API Contract
**[API_CONTRACT.md](API_CONTRACT.md)** - Complete API specification

This document contains:
- All API endpoints with examples
- Request/response formats
- Data models (TypeScript definitions)
- Authentication flow
- Error codes and handling

**Use this when:**
- Integrating with the backend API
- Understanding data structures
- Implementing API calls
- Debugging API issues

## Frontend Architecture

### Current Structure

```
frontend/
├── app/                    # Expo Router pages
│   └── (tabs)/            # Tab navigation screens
│       ├── index.tsx      # Home/Dashboard
│       ├── workout.tsx    # Workout tracking
│       ├── nutrition.tsx  # Nutrition logging
│       ├── progress.tsx   # Progress tracking
│       └── profile.tsx    # User profile
│
├── src/
│   ├── components/        # Reusable components
│   │   ├── features/     # Feature-specific components
│   │   │   ├── workout/
│   │   │   ├── nutrition/
│   │   │   ├── progress/
│   │   │   └── profile/
│   │   └── ui/           # Generic UI components
│   │
│   ├── contexts/         # React Context providers
│   │   ├── AppDataContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useAsyncData.ts
│   │   ├── useModalManager.ts
│   │   └── useWorkoutData.ts
│   │
│   ├── services/         # API and data services
│   │   ├── localApi.ts   # Mock API (to be replaced)
│   │   └── localStorage.ts
│   │
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── utils/            # Utility functions
│       ├── calculations.ts
│       ├── date.ts
│       └── formatting.ts
│
└── assets/              # Images, fonts, etc.
```

## Key Concepts

### Feature-Based Architecture

Components are organized by feature (workout, nutrition, progress, profile), making it easy to:
- Find related code
- Maintain feature boundaries
- Scale the application
- Onboard new developers

### Custom Hooks Pattern

Business logic is extracted into custom hooks:
- `useWorkoutData` - Workout state management
- `useNutritionData` - Nutrition tracking logic
- `useProgressData` - Progress statistics
- `useAsyncData` - Generic async data fetching
- `useModalManager` - Modal state management

### Context for Global State

- `AppDataContext` - User data, workouts, nutrition
- `ThemeContext` - App theme and styling

## Testing

Tests are located alongside the code:

```
src/
├── utils/__tests__/          # Utility function tests
│   ├── calculations.test.ts
│   ├── date.test.ts
│   └── formatting.test.ts
│
└── hooks/__tests__/          # Hook tests
    ├── useAsyncData.test.ts
    └── useModalManager.test.ts
```

**Run tests:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## API Integration Guide

### Current State (Mock Data)

The app currently uses `src/services/localApi.ts` which simulates backend responses using AsyncStorage.

### Migration to Real API

**Step 1: Create API client**

Create `src/services/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Step 2: Update service calls**

Replace `localApi.ts` methods with real API calls:
```typescript
// Before (mock)
import { localApi } from './localApi';
const workouts = await localApi.getWorkouts();

// After (real API)
import api from './api';
const response = await api.get('/workouts');
const workouts = response.data.data;
```

**Step 3: Environment configuration**

Create `.env`:
```
API_BASE_URL=https://api.gymie.com/v1
```

**Step 4: Update Context providers**

Update `AppDataContext.tsx` to use real API endpoints.

**Step 5: Handle authentication**

Implement JWT token storage and refresh logic in auth context.

## Data Models

All data models are defined in `src/types/index.ts` and match the backend API contract.

Key models:
- `User` - User profile and settings
- `Workout` - Workout with exercises and sets
- `Exercise` - Exercise with sets
- `WorkoutSet` - Individual set (weight, reps, completed)
- `NutritionDay` - Daily nutrition with meals
- `Meal` - Meal with food items
- `ProgressPhoto` - Progress photo entry
- `WeightEntry` - Weight tracking entry

See [API_CONTRACT.md](API_CONTRACT.md) for complete model definitions.

## Common Tasks

### Adding a New Feature

1. Create feature folder: `src/components/features/new-feature/`
2. Create components: `components/`, `modals/`
3. Create custom hook: `src/hooks/useNewFeature.ts`
4. Add screen: `app/(tabs)/new-feature.tsx`
5. Update navigation if needed

### Adding a New API Endpoint

1. Check [API_CONTRACT.md](API_CONTRACT.md) for endpoint specification
2. Add method to `src/services/api.ts`
3. Update relevant hook or context
4. Test with backend

### Styling Components

The app uses:
- React Native built-in components
- Custom theme via `ThemeContext`
- Tailwind-style utility approach
- Consistent colors and spacing defined in `constants/theme.ts`

## Performance Tips

1. **Use memo for expensive renders**
   ```typescript
   const MemoizedComponent = React.memo(MyComponent);
   ```

2. **Optimize lists with FlatList**
   ```typescript
   <FlatList
     data={items}
     keyExtractor={item => item.id}
     renderItem={({ item }) => <ItemComponent item={item} />}
   />
   ```

3. **Lazy load images**
   ```typescript
   import { Image } from 'expo-image';
   <Image source={uri} placeholder={blurhash} />
   ```

## Debugging

### React Native Debugger
```bash
# Open debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Expo Developer Tools
```bash
npm start
# Press 'j' to open debugger
```

### Common Issues

**Issue: Metro bundler cache**
```bash
npm start -- --clear
```

**Issue: Pod install issues (iOS)**
```bash
cd ios && pod install --repo-update && cd ..
```

**Issue: Build errors**
```bash
rm -rf node_modules
npm install
```

## Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Backend API Contract**: [API_CONTRACT.md](API_CONTRACT.md)

---

For backend documentation, see [`../../backend/docs/`](../../backend/docs/)
