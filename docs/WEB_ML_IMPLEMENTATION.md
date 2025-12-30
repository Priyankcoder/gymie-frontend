
# Web ML Implementation Status

## Current Status: Partial Implementation

### What Works
- ✅ Application loads on web without crashing
- ✅ Platform-specific service resolution (`.web.ts` files)
- ✅ Graceful degradation when ML is unavailable
- ✅ Database operations work on web (expo-sqlite supports web)
- ✅ Native ML works on Android and iOS

### What Doesn't Work (Yet)
- ❌ ONNX Runtime Web integration
- ❌ Food recognition from images on web
- ❌ Camera/photo capture on web

## Technical Challenge

### The Problem
The initial implementation attempted to load ONNX Runtime Web dynamically from CDN, but encountered Metro bundler compatibility issues with dynamic imports. Error code `44936376` indicates the script loading failed.

### Why It's Complex
1. **Metro Bundler Limitations**: React Native's Metro bundler doesn't handle dynamic imports the same way webpack does
2. **WASM Dependencies**: ONNX Runtime Web requires WebAssembly files that need special handling
3. **Module System**: Conflicts between ESM/CommonJS module systems

## Current Web Implementation

### File Structure
```
frontend/src/services/
├── MLInferenceService.ts          # Native (TFLite) implementation
├── MLInferenceService.web.ts      # Web stub (ML unavailable)
├── NutritionDatabaseService.ts    # Native SQLite
├── NutritionDatabaseService.web.ts # Web SQLite (works!)
└── OfflineNutritionService.ts     # Cross-platform orchestrator
```

### How It Works Now
1. On web, `MLInferenceService.web.ts` is automatically used instead of the native version
2. The service returns `isAvailable() => false`
3. Any attempt to use ML prediction throws a helpful error message
4. The app continues to function for other features (database, manual entry, etc.)

## Future Implementation Path

### Option 1: ONNX Runtime Web (Recommended)
**Pros:**
- Best performance
- Runs entirely client-side
- No server costs

**Implementation Steps:**
1. Install `onnxruntime-web` properly (✅ Done but not used)
2. Configure webpack/Metro to handle WASM files properly
3. Load model from `/public/ml-model/vision_v1.onnx` (✅ Model in place)
4. Implement image preprocessing in JavaScript
5. Handle tensor operations for inference

**Challenges:**
- Metro bundler compatibility
- WASM file serving
- Cross-origin headers for SharedArrayBuffer

### Option 2: TensorFlow.js
**Pros:**
- Better React Native Web integration
- More documentation/examples
- Smaller bundle size options

**Cons:**
- Need to convert ONNX model to TF.js format
- Different API than native implementation

### Option 3: Server-Side Inference
**Pros:**
- Simplest client implementation
- Works everywhere
- Centralized model updates

**Cons:**
- Server costs
- Network latency
- Privacy concerns (sending food photos to server)

### Option 4: Progressive Enhancement
**Pros:**
- Works today
- Better mobile experience (primary use case)
- Web users can still use manual entry

**Current Status:** ✅ **This is what we have now**

## Files Involved

### Model Files (Ready)
- `frontend/ml-model/vision_v1.onnx` - ONNX model for web
- `frontend/ml-model/labels.json` - Class labels
- `frontend/public/ml-model/vision_v1.onnx` - Copy for web serving
- `frontend/public/ml-model/labels.json` - Copy for web serving

### Service Files
- `frontend/src/services/MLInferenceService.web.ts` - Web stub
- `frontend/src/services/NutritionDatabaseService.web.ts` - Working web DB

### Configuration
- `frontend/metro.config.js` - Updated to handle `.onnx` and `.wasm`
- `frontend/package.json` - Dependencies listed

## Recommended Next Steps

### Short Term (Current)
- [x] Create stub implementation
- [x] Ensure app loads on web
- [x] Document status
- [ ] Add UI message on web: "Food recognition available on mobile app"

### Medium Term (Future Sprint)
- [ ] Implement proper ONNX Runtime Web integration
- [ ] Test across browsers (Chrome, Firefox, Safari)
- [ ] Optimize model loading (lazy load, caching)
- [ ] Add web-specific image preprocessing

### Long Term
- [ ] Consider TensorFlow.js for better compatibility
- [ ] Evaluate server-side option for scale
- [ ] A/B test performance across platforms

## Testing

### To Test Current Implementation
```bash
cd frontend
npm run web
```

**Expected Result:**
- App loads successfully
- No ML-related errors in console (just warnings)
- Database operations work
- Manual food entry works
- Camera/ML features show appropriate messages

## References

- [ONNX Runtime Web Docs](https://onnxruntime.ai/docs/tutorials/web/)
- [Expo Web Support](https://docs.expo.dev/workflow/web/)
- [expo-sqlite Web Support](https://docs.expo.dev/versions/latest/sdk/sqlite/)
