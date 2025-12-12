
# Gymie - Modern Fitness Companion App

A cross-platform mobile fitness app built with React Native and Expo, featuring workout logging, nutrition tracking with AI meal estimation, tools, and progress photos.

## 🚀 Features

### Home Dashboard
- Daily calories and macros ring visualization
- Steps tracking (syncs with Apple Health/Google Fit)
- Today's workout summary
- Quick action cards for common tasks

### Workout Logger
- Comprehensive exercise database
- Log sets, reps, weight, and RPE
- Rest timer between sets
- Automatic PR detection
- Workout history

### PR Tracker
- Track personal records by exercise
- Filter by rep range
- Visual highlighting of best lifts

### AI Meal Macro Estimation
- Upload meal photos
- Local mock AI estimation (realistic randomized macros)
- Edit macros manually
- Add to daily diet log

### Diet Planner
- Daily meal cards (breakfast/lunch/dinner/snacks)
- Add meals manually
- Macro totals and remaining breakdown

### Recipe Generator
- Enter available ingredients
- Get recipe suggestions with macros
- Prep and cook times

### Tools
- **Plate Calculator**: Calculate plates per side for target weight
- **Warm-up Calculator**: Generate warm-up protocol for working weight
- **Stopwatch**: Track time with lap functionality

### Progress Photos
- Store photos locally
- Timeline view grouped by month
- Compare mode (select 2 photos side-by-side)

### Profile & Settings
- Light/Dark theme toggle
- Weight unit selection (kg/lb)
- Daily goals configuration
- Steps sync toggle

## 📱 Screenshots

The app supports both **Light** and **Dark** modes across all screens.

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Context
- **Storage**: AsyncStorage
- **UI Components**: Custom design system
- **Icons**: @expo/vector-icons (Ionicons)
- **Charts**: react-native-svg

## 📁 Project Structure

```
Gymie/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── _layout.tsx      # Tab navigator
│   │   ├── index.tsx        # Home Dashboard
│   │   ├── workout.tsx      # Workout Logger
│   │   ├── nutrition.tsx    # Nutrition/Diet
│   │   ├── tools.tsx        # Calculator Tools
│   │   └── profile.tsx      # Profile/Settings
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── MacroBar.tsx
│   │       ├── MetricRing.tsx
│   │       ├── QuickActionCard.tsx
│   │       ├── StatCard.tsx
│   │       └── index.ts
│   ├── constants/
│   │   └── theme.ts         # Design tokens
│   ├── contexts/
│   │   └── ThemeContext.tsx # Theme provider
│   ├── data/
│   │   └── seedData.ts      # Sample data
│   ├── services/
│   │   ├── localApi.ts      # Local API simulation
│   │   └── localStorage.ts  # AsyncStorage wrapper
│   └── types/
│       └── index.ts         # TypeScript types
├── assets/                   # Images and fonts
├── app.json                  # Expo configuration
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gymie.git
cd gymie
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web (limited support)
npm run web
```

### Seeding Sample Data

To populate the app with sample data for testing, you can call the seed function from the developer console or add it to the app initialization:

```typescript
import { seedDatabase } from './src/data/seedData';

// Call this once to seed data
await seedDatabase();
```

## 🎨 Design System

### Colors

**Light Mode:**
- Background: `#F7FAFC`
- Card: `#FFFFFF`
- Primary Text: `#0B0B0B`
- Accent Blue: `#0A74FF`

**Dark Mode:**
- Background: `#0B1220`
- Card: `#0F1724`
- Primary Text: `#E6EEF8`
- Accent Blue: `#5EA1FF`

### Typography
- Headline: Bold, 24-32px
- Title: SemiBold, 18-20px
- Body: Regular, 14-16px
- Mono: For numbers and stats

### Components
- Rounded cards (16px radius)
- Soft shadows
- Metric rings for progress
- Bottom tab navigation (5 tabs)

## 🔌 Local API Simulation

All API calls are simulated locally with artificial delays (200-600ms) to mimic real network behavior:

```typescript
import { localApi } from './src/services/localApi';

// Get user preferences
const prefs = await localApi.preferences.get();

// Create a workout
const workout = await localApi.workouts.create({...});

// Estimate meal macros from image
const estimation = await localApi.meals.estimateFromImage(imageUri);

// Generate recipes from ingredients
const recipes = await localApi.recipes.generateFromIngredients(['chicken', 'rice']);
```

## 📦 Key Dependencies

```json
{
  "expo": "~54.0.28",
  "expo-router": "~6.0.18",
  "react-native": "0.81.5",
  "@react-native-async-storage/async-storage": "latest",
  "react-native-svg": "latest",
  "expo-image-picker": "latest",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1"
}
```

## 🔮 Future Enhancements

- Real AI integration for meal estimation
- Apple HealthKit / Google Fit sync
- Workout templates
- Social features
- Cloud backup
- Push notifications for rest timers
- Export data functionality

## 📄 License

MIT License

---

Built with ❤️ using React Native and Expo
