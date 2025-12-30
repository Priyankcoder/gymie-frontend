
# ML Implementation Complete - On-Device Food Recognition

## Overview
Complete implementation of offline-first, on-device machine learning for food recognition using TensorFlow Lite on both Android and iOS platforms.

## Architecture Summary

### Model Specifications
- **Model**: MobileNetV3-Small (Food101 dataset)
- **Input**: 224x224 RGB images
- **Normalization**: `(pixel - 127.5) / 127.5` → Range: [-1, 1]
- **Output**: 101 food classes
- **Engine**: TensorFlow Lite (CPU delegate)
- **File**: `vision_v1.0.0.tflite` (7.7MB)

### Portion Estimation
Heuristic-based (not ML):
- **Small**: dish_area < 15% of image
- **Medium**: dish_area < 35% of image  
- **Large**: dish_area ≥ 35% of image

### Data Flow
```
Image Capture
    ↓
ML Inference (TFLite)
    ↓
Portion Estimation (Heuristic)
    ↓
Nutrition Lookup (SQLite)
    ↓
Result Aggregation
```

## Implementation Details

### 1. Native Android Module

**File**: `frontend/android/app/src/main/java/com/gymie/NutritionClassifierModule.kt`

**Key Features**:
- TensorFlow Lite interpreter with CPU delegate
- Image preprocessing: Resize → Normalize → Float32 tensor
- Batch inference support
- Thread-safe operations
- Error handling with Promise rejection

**Dependencies** (`build.gradle`):
```gradle
implementation 'org.tensorflow:tensorflow-lite:2.14.0'
implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
```

### 2. Native iOS Module

**File**: `frontend/ios/NutritionClassifier.swift`

**Key Changes**:
- ✅ **Replaced CoreML with TensorFlow Lite** (solves conversion issues)
- Manual image preprocessing in Swift
- UIImage → CVPixelBuffer → Float32 array
- Same normalization as Android for consistency

**Dependencies** (`Podfile` - auto-added by plugin):
```ruby
pod 'TensorFlowLiteSwift', '~> 2.14.0'
```

### 3. Service Layer (TypeScript)

#### **OfflineNutritionService** (`src/services/OfflineNutritionService.ts`)
Main orchestrator that coordinates:
- ML inference via native module
- Portion estimation (heuristic)
- Nutrition database lookup
- Result aggregation with confidence scores

#### **PortionEstimationService** (`src/services/PortionEstimationService.ts`)
Implements heuristic logic:
```typescript
const ratio = dimensions.dish_area / dimensions.total_area;
if (ratio < 0.15) return 'small';
if (ratio < 0.35) return 'medium';
return 'large';
```

#### **NutritionDatabaseService** (`src/services/NutritionDatabaseService.ts`)
SQLite operations:
- Schema: `dish_master`, `dish_nutrition`, `user_corrections`
- CRUD operations for nutrition data
- User correction tracking

#### **DatabaseSeeder** (`src/services/DatabaseSeeder.ts`)
Seeds initial data:
- Food101 nutrition values
- Placeholder data generator
- First-run initialization

### 4. Asset Deployment

**Android**:
- `frontend/android/app/src/main/assets/vision_v1.0.0.tflite`
- `frontend/android/app/src/main/assets/dish_labels.txt`

**iOS**:
- `frontend/ios/vision_v1.0.0.tflite`
- `frontend/ios/dish_labels.txt`

### 5. Configuration

**Expo Plugin**: `frontend/plugins/withNutritionClassifier.js`
- Auto-configures native modules
- Adds TensorFlow Lite dependencies
- Creates Swift bridging header
- Modifies MainApplication.kt for Android
- Adds TensorFlowLiteSwift pod for iOS

## Technical Decisions

### Why TensorFlow Lite for iOS (not CoreML)?
1. **Consistency**: Same inference engine across platforms
2. **No Conversion**: Uses existing `.tflite` model directly
3. **Version Issues**: Avoids Keras→CoreML conversion failures
4. **Proven Solution**: TFLite works on both platforms

### Why Heuristic Portion Estimation?
1. **Architecture Requirement**: Specified in design doc
2. **Simplicity**: No additional ML model needed
3. **Speed**: Instant calculation, no inference time
4. **Offline**: No network required

### Why SQLite (not Realm/Firebase)?
1. **Offline-First**: No network dependency
2. **React Native Support**: expo-sqlite works out of box
3. **Lightweight**: Minimal overhead
4. **Standard SQL**: Easy to query and maintain

## File Structure

```
frontend/
├── android/
│   └── app/src/main/
│       ├── assets/
│       │   ├── vision_v1.0.0.tflite
│       │   └── dish_labels.txt
│       └── java/com/gymie/
│           ├── NutritionClassifierModule.kt
│           └── NutritionClassifierPackage.kt
├── ios/
│   ├── NutritionClassifier.swift
│   ├── NutritionClassifier.m (Bridge)
│   ├── vision_v1.0.0.tflite
│   └── dish_labels.txt
├── src/services/
│   ├── OfflineNutritionService.ts
│   ├── PortionEstimationService.ts
│   ├── NutritionDatabaseService.ts
│   ├── DatabaseSeeder.ts
│   └── MLInferenceService.ts
├── plugins/
│   └── withNutritionClassifier.js
└── docs/
    └── ML_IMPLEMENTATION_COMPLETE.md
```

## Database Schema

### dish_master
```sql
CREATE TABLE dish_master (
  dish_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT,
  cuisine TEXT,
  aliases TEXT,
  created_at INTEGER,
  updated_at INTEGER
)
```

### dish_nutrition
```sql
CREATE TABLE dish_nutrition (
  dish_id TEXT PRIMARY KEY,
  base_serving_grams INTEGER,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fat REAL,
  fiber REAL,
  sodium INTEGER,
  FOREIGN KEY (dish_id) REFERENCES dish_master(dish_id)
)
```

### user_corrections
```sql
CREATE TABLE user_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_dish_id TEXT,
  corrected_dish_id TEXT,
  correction_count INTEGER DEFAULT 1,
  last_corrected_at INTEGER,
  UNIQUE(original_dish_id, corrected_dish_id)
)
```

## Next Steps

### 1. iOS Build Setup
```bash
cd frontend/ios
pod install
```

### 2. Database Seeding
- Populate `dish_master` and `dish_nutrition` with Food101 data
- Run seeder on first app launch

### 3. UI Integration
- Connect `OfflineNutritionService` to Camera screen
- Display prediction results
- Show confidence scores
- Allow user corrections

### 4. Testing
- Unit tests for services
- Integration tests for native modules
- End-to-end tests for full flow

### 5. Performance Optimization
- Benchmark inference time
- Optimize image preprocessing
- Cache nutrition lookups
- Profile memory usage

## Performance Expectations

- **Inference Time**: ~100-300ms (CPU)
- **Model Size**: 7.7MB
- **Memory Usage**: ~50-100MB during inference
- **Accuracy**: ~70% Top-1, ~90% Top-5 (Food101 dataset)

## Error Handling

### Native Module Errors
- Model not found
- Invalid image format
- Inference failure
- Out of memory

### Database Errors
- Schema creation failure
- Insert/update errors
- Query timeouts

### Service Layer Errors
- Invalid dimensions
- Missing nutrition data
- Seeding failures

All errors are propagated with descriptive messages for debugging.

## References

- Architecture: `backend/docs/OFFLINE_FIRST_NUTRITION_ARCHITECTURE.md`
- TensorFlow Lite: https://www.tensorflow.org/lite
- Food101 Dataset: https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- Expo Modules: https://docs.expo.dev/modules/overview/

---

**Status**: ✅ Implementation Complete
**Last Updated**: 2024-12-30
**Version**: 1.0.0
