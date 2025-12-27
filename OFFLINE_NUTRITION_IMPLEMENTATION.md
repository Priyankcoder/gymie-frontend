# Offline-First Nutrition Implementation - React Native

## Overview

This document details the implementation of the offline-first nutrition tracking system for the Gymie React Native app. The system provides **deterministic nutrition data** using a local SQLite database, eliminating the need for mock AI estimations.

## ✅ What Was Implemented

### 1. SQLite Nutrition Database Service
**File:** [`frontend/src/services/nutritionDatabase.ts`](src/services/nutritionDatabase.ts)

**Features:**
- Local SQLite database with 30+ Indian dishes (expandable to 500+)
- Deterministic nutrition calculations
- Portion size multipliers (small: 0.75x, medium: 1.0x, large: 1.3x)
- User correction tracking for future ML improvements
- Full offline functionality

**Key Tables:**
- `dish_master` - Dish information (ID, name, category, cuisine)
- `dish_nutrition_master` - Nutrition data per dish
- `user_corrections` - User feedback for ML training

**Example Dishes:**
```typescript
- Chicken Biryani: 450 cal, 25g protein (medium portion)
- Dal Makhani: 220 cal, 10g protein (medium portion)
- Butter Chicken: 380 cal, 28g protein (medium portion)
- Samosa: 262 cal, 5g protein (medium portion)
```

### 2. Offline Nutrition Service
**File:** [`frontend/src/services/offlineNutritionService.ts`](src/services/offlineNutritionService.ts)

**Features:**
- Integration layer between UI and database
- Dish search functionality
- Portion-based nutrition calculation
- Image hash generation for correction tracking
- Statistics for unsynced corrections

**Key Methods:**
```typescript
- initialize() - Set up database
- searchDishes(query) - Search by name
- getNutritionForDish(dishId, portion) - Calculate nutrition
- getDishWithAllPortions(dishId) - Get all portion sizes
- recordCorrection() - Track user corrections
```

### 3. React Native Hook
**File:** [`frontend/src/hooks/nutrition/useOfflineNutrition.ts`](src/hooks/nutrition/useOfflineNutrition.ts)

**Features:**
- Image picker/camera integration
- Real-time dish search
- Portion selection
- Nutrition estimation
- Meal saving with proper types

**State Management:**
```typescript
- selectedImage: Image URI
- searchQuery: Current search term
- searchResults: Filtered dishes
- selectedDish: User's dish choice
- selectedPortion: Size (small/medium/large)
- nutritionEstimation: Calculated nutrition
```

### 4. Dish Selector Modal
**File:** [`frontend/src/components/features/nutrition/modals/DishSelectorModal.tsx`](src/components/features/nutrition/modals/DishSelectorModal.tsx)

**Features:**
- Image preview
- Searchable dish list
- Portion size selector with multipliers
- Real-time nutrition display
- Meal type selection
- Save to food diary

**UI Flow:**
1. User takes/picks photo
2. User searches and selects dish
3. User chooses portion size
4. System calculates nutrition
5. User saves to meal type

### 5. Updated Nutrition Screen
**File:** [`frontend/app/(tabs)/nutrition.tsx`](app/(tabs)/nutrition.tsx)

**Changes:**
- Replaced `useAIEstimation` with `useOfflineNutrition`
- Replaced `AIEstimationModal` with `DishSelectorModal`
- Updated card text to reflect offline-first approach
- Integrated new dish selection workflow

## 🔧 How It Works

### Data Flow

```
1. User Action
   └─> Take Photo / Pick Image
       └─> Opens Dish Selector Modal

2. Dish Selection
   └─> User searches dishes
       └─> Selects from 30+ options
           └─> Chooses portion size

3. Nutrition Calculation
   └─> SQLite lookup (dish_id)
       └─> Apply portion multiplier
           └─> Return scaled nutrition

4. Save Meal
   └─> Create Meal object
       └─> Save to local storage
           └─> Refresh UI
```

### Portion Multipliers

As per architecture:
```typescript
{
  small: 0.75,   // 75% of base serving
  medium: 1.0,   // 100% of base serving  
  large: 1.3,    // 130% of base serving
}
```

### Example Calculation

```typescript
Base Nutrition (Chicken Biryani, 300g):
- Calories: 450
- Protein: 25g
- Carbs: 50g
- Fat: 15g

User selects "Large" portion (1.3x):
- Calories: 585 (450 × 1.3)
- Protein: 32.5g (25 × 1.3)
- Carbs: 65g (50 × 1.3)
- Fat: 19.5g (15 × 1.3)
```

## 📊 Current Status

### ✅ Phase 1 Complete (Manual Selection)
- [x] SQLite database with 30 dishes
- [x] Offline-first architecture
- [x] Manual dish selection UI
- [x] Portion-based calculations
- [x] Full integration with app
- [x] No mock data - real nutrition values

### 🔄 Phase 2 (Future - ML Integration)
- [ ] Add TensorFlow Lite model
- [ ] On-device ML classification
- [ ] Automatic dish prediction
- [ ] User correction UI for training
- [ ] Background sync to backend
- [ ] Model version updates (OTA)

## 🚀 Running the App

### Prerequisites
```bash
cd frontend
npm install  # All dependencies already in package.json
```

### Start Development
```bash
npm start
```

### Key Dependencies
- ✅ `expo-sqlite` - Already installed
- ✅ `expo-image-picker` - Already installed
- ✅ `expo-file-system` - Already installed
- ✅ `expo-crypto` - Already installed (for image hashing)

## 📱 User Experience

### Before (Mock AI)
```
1. User takes photo
2. System generates RANDOM numbers
3. Random nutrition displayed
4. No real data, no consistency
```

### After (Offline-First)
```
1. User takes photo
2. User searches/selects dish from database
3. User chooses portion size
4. System calculates REAL nutrition
5. Consistent, deterministic results
```

## 🔍 Testing

### Manual Testing Steps

1. **Start App:**
   ```bash
   cd frontend && npm start
   ```

2. **Navigate to Nutrition Tab**

3. **Test Dish Selection:**
   - Tap "Take Photo" or "Upload"
   - Select/take an image
   - Search for "Biryani"
   - Select "Chicken Biryani"
   - Choose portion size
   - Verify nutrition values

4. **Verify Database:**
   - Search should return results
   - Nutrition should be deterministic
   - Same dish = same nutrition

5. **Test Meal Saving:**
   - Complete dish selection
   - Choose meal type (Breakfast/Lunch/Dinner/Snack)
   - Save meal
   - Verify it appears in food diary

### Expected Results

```typescript
// Chicken Biryani - Medium Portion
{
  calories: 450,
  protein: 25,
  carbs: 50,
  fat: 15,
  confidence: 1.0, // 100% confidence (manual selection)
  isManualSelection: true
}
```

## 📝 Database Schema

### dish_master
```sql
CREATE TABLE dish_master (
  dish_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### dish_nutrition_master
```sql
CREATE TABLE dish_nutrition_master (
  dish_id TEXT PRIMARY KEY,
  base_serving_grams INTEGER NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  fiber REAL NOT NULL,
  sodium REAL NOT NULL,
  FOREIGN KEY (dish_id) REFERENCES dish_master(dish_id)
);
```

### user_corrections
```sql
CREATE TABLE user_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_hash TEXT NOT NULL,
  predicted_dish_id TEXT,
  corrected_dish_id TEXT,
  predicted_portion TEXT,
  corrected_portion TEXT,
  confidence REAL,
  device_type TEXT,
  app_version TEXT,
  synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 Integration with Backend

### Future Sync Endpoints (Already Implemented in Backend)

```typescript
// Backend endpoints ready for Phase 2
POST /v1/sync/corrections       // Upload user corrections
GET  /v1/sync/model-versions    // Check for model updates
GET  /v1/sync/dishes/search     // Search backend dish database
GET  /v1/sync/nutrition-db      // Download updated database
```

## 🎯 Key Benefits

1. **No Mock Data** - Real nutrition values from curated database
2. **100% Offline** - Works without network
3. **Fast** - Instant search and calculation
4. **Deterministic** - Same input = same output
5. **Privacy** - No images uploaded
6. **Scalable** - Can add 500+ dishes easily
7. **Cost-Effective** - Zero API costs

## 📂 File Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── nutritionDatabase.ts          ✅ SQLite wrapper
│   │   └── offlineNutritionService.ts    ✅ Business logic
│   ├── hooks/
│   │   └── nutrition/
│   │       └── useOfflineNutrition.ts    ✅ React hook
│   └── components/
│       └── features/
│           └── nutrition/
│               ├── components/
│               │   └── AIUploadCard.tsx   ✅ Updated
│               └── modals/
│                   └── DishSelectorModal.tsx ✅ New
└── app/
    └── (tabs)/
        └── nutrition.tsx                  ✅ Updated
```

## 🚧 Known Limitations

1. **No ML Prediction** - Currently manual selection only (Phase 2)
2. **Limited Dishes** - 30 dishes (can expand to 500+)
3. **No Backend Sync** - Corrections stored locally only (Phase 2)
4. **No Model Updates** - Database is static (Phase 2 will add OTA updates)

## 🔮 Next Steps for Phase 2

1. **Add TensorFlow Lite:**
   ```bash
   # Use Expo native modules or React Native Vision Camera
   # Integrate mobilenet_v3_small_food.tflite
   ```

2. **Implement ML Service:**
   ```typescript
   // frontend/src/services/mlClassifier.ts
   - Load model from assets
   - Classify image -> dish_id
   - Return confidence score
   ```

3. **Add Background Sync:**
   ```typescript
   // frontend/src/services/nutritionSyncService.ts
   - Upload corrections to backend
   - Download database updates
   - Check for model updates
   ```

4. **Update UI:**
   - Show ML predictions
   - Allow corrections
   - Display confidence
   - Show sync status

## 📞 Support

For questions or issues:
- Check [`backend/docs/OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md`](../backend/docs/OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md)
- Review [`backend/docs/OFFLINE_NUTRITION_API.md`](../backend/docs/OFFLINE_NUTRITION_API.md)
- See [`backend/docs/MOBILE_INTEGRATION_GUIDE.md`](../backend/docs/MOBILE_INTEGRATION_GUIDE.md)

## ✅ Summary

The offline-first nutrition system is now **fully functional** with:
- Real nutrition database (no mock data)
- Manual dish selection
- Portion-based calculations
- Full offline support
- Ready for Phase 2 ML integration

**The app no longer uses mock random nutrition values!**
