
# Development Build Guide for Gymie

Since this app uses native modules (TensorFlow Lite for ML inference), it cannot run in Expo Go. You need to create a development build and run it in Android Studio or Xcode.

## Prerequisites

### For Android:
- Android Studio installed (latest stable version)
- Android SDK installed (API Level 34 or higher)
- Java Development Kit (JDK) 17 or higher
- Android device or emulator

### For iOS (macOS only):
- Xcode installed (latest stable version)
- CocoaPods installed (`sudo gem install cocoapods`)
- iOS Simulator or physical iOS device
- Apple Developer account (for physical device)

## Running on Android

### Step 1: Prebuild Android Project
```bash
cd frontend
npx expo prebuild --platform android
```

This generates the `android/` directory with all native code.

### Step 2: Start Metro Bundler
In one terminal, start the Metro bundler:
```bash
cd frontend
npm start
```

### Step 3: Run on Android

**Option A: Using Expo CLI (Recommended)**
```bash
# In a new terminal
cd frontend
npm run android
```

**Option B: Using Android Studio**
1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `frontend/android` and open it
4. Wait for Gradle sync to complete
5. Select your device/emulator from the device dropdown
6. Click the "Run" button (green play icon) or press Shift+F10

**Option C: Using Command Line**
```bash
cd frontend/android
./gradlew installDebug
# Or for release build:
./gradlew installRelease
```

### Troubleshooting Android:

**Gradle Build Errors:**
```bash
cd frontend/android
./gradlew clean
./gradlew build
```

**SDK/JDK Issues:**
1. Open Android Studio
2. Go to File → Project Structure → SDK Location
3. Ensure Android SDK and JDK paths are correct

**Metro Bundler Connection Issues:**
```bash
# Clear cache and restart
cd frontend
npx expo start --clear
```

## Running on iOS (macOS only)

### Step 1: Prebuild iOS Project
```bash
cd frontend
npx expo prebuild --platform ios
```

This generates the `ios/` directory with all native code.

### Step 2: Install CocoaPods Dependencies
```bash
cd frontend/ios
pod install
cd ..
```

### Step 3: Start Metro Bundler
In one terminal, start the Metro bundler:
```bash
cd frontend
npm start
```

### Step 4: Run on iOS

**Option A: Using Expo CLI (Recommended)**
```bash
# In a new terminal
cd frontend
npm run ios
```

**Option B: Using Xcode**
1. Open Xcode
2. Open the workspace file: `frontend/ios/gymie.xcworkspace` (NOT the .xcodeproj file)
3. Select your simulator or device from the device dropdown
4. Click the "Run" button (play icon) or press Cmd+R

**Option C: Using Command Line**
```bash
# For simulator
cd frontend
npx expo run:ios --device "iPhone 15 Pro"

# For physical device
npx expo run:ios --device "Your Device Name"
```

### Troubleshooting iOS:

**CocoaPods Issues:**
```bash
cd frontend/ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod deintegrate
pod install
```

**Code Signing Issues:**
1. Open the project in Xcode
2. Select the project in the navigator
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Xcode will automatically manage signing

**Module Not Found Errors:**
```bash
cd frontend
npx expo start --clear
```

## First-Time Setup After Prebuild

After running `npx expo prebuild`, you need to ensure the ML model files are in the correct location:

### Android:
```bash
# Copy model files to Android assets
cp frontend/ml-model/vision_v1.tflite frontend/android/app/src/main/assets/
cp frontend/ml-model/labels.json frontend/android/app/src/main/assets/
```

### iOS:
The model files should be linked automatically, but verify they're in:
```
frontend/ios/gymie/vision_v1.tflite
frontend/ios/gymie/labels.json
```

## Development Workflow

1. **Start Metro Bundler:**
   ```bash
   npm start
   ```

2. **Run App:**
   - Android: `npm run android` or use Android Studio
   - iOS: `npm run ios` or use Xcode

3. **Make Code Changes:**
   - JavaScript/TypeScript changes will hot-reload automatically
   - Native code changes require rebuilding:
     - Android: `./gradlew installDebug` in `android/` directory
     - iOS: Cmd+R in Xcode or `npm run ios`

4. **Clean Build (if needed):**
   ```bash
   # Clear all caches
   cd frontend
   npx expo start --clear
   
   # Android clean
   cd android && ./gradlew clean && cd ..
   
   # iOS clean
   cd ios && xcodebuild clean && cd ..
   ```

## Common Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web (ML features will use stub implementation)
npm run web

# Clear all caches
npx expo start --clear

# Rebuild native code
npx expo prebuild --clean
```

## Notes

- **Expo Go Limitation:** Cannot be used due to native TensorFlow Lite module
- **Development Builds:** Required for testing native ML features
- **Web Version:** Uses a different ML implementation (TensorFlow.js) or stub
- **First Build:** May take 10-15 minutes for Android, 5-10 minutes for iOS
- **Incremental Builds:** Much faster (1-2 minutes)

## Debugging

### Enable Debug Mode:
- **Android:** Shake device → "Debug JS Remotely"
- **iOS:** Shake device → "Debug"
- **Or:** Press `d` in Metro terminal → "Open Debugger"

### View Logs:
```bash
# Android logs
npx react-native log-android

# iOS logs
npx react-native log-ios
```

### Performance Profiling:
- Use React DevTools
- Android Studio Profiler for native performance
- Xcode Instruments for iOS performance

## Next Steps

After successfully running the app:
1. Test the camera/image picker functionality
2. Test ML model inference with food images
3. Verify offline database operations
4. Test nutrition tracking features
5. Profile performance on actual devices
