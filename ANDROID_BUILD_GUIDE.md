
# Android Build & Export Guide for Gymie

This guide covers building and exporting your Gymie app as an APK or AAB file.

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **Login to EAS**:
   ```bash
   eas login
   ```

## Build Methods

### Method 1: EAS Build (Recommended - Cloud Build)

EAS Build runs on Expo's servers, so you don't need Android Studio or local setup.

#### Step 1: Initialize EAS Build
```bash
cd frontend
eas build:configure
```

#### Step 2: Build APK (Installable File)

For testing/distribution outside Google Play Store:
```bash
# Development build (with debugging)
eas build --profile development --platform android

# Preview build (release-ready APK)
eas build --profile preview --platform android
```

#### Step 3: Build AAB (Google Play Store)

For publishing to Google Play Store:
```bash
eas build --profile production --platform android
```

#### Step 4: Download the Build

After the build completes (usually 10-20 minutes):
1. You'll get a URL to download the APK/AAB
2. Or download from: https://expo.dev/accounts/[your-account]/projects/Gymie/builds

#### Step 5: Install APK on Device

**Via USB:**
```bash
adb install path/to/your-app.apk
```

**Via QR Code/Link:**
1. Open the build URL on your phone
2. Download and install the APK
3. Enable "Install from Unknown Sources" if prompted

---

### Method 2: Local Build (Requires Android Studio)

Build locally if you need full control or can't use cloud builds.

#### Step 1: Prebuild Android Project
```bash
cd frontend
npx expo prebuild --platform android
```

#### Step 2: Copy ML Model Assets
```bash
mkdir -p android/app/src/main/assets
cp ml-model/vision_v1.tflite android/app/src/main/assets/
cp ml-model/labels.json android/app/src/main/assets/
```

#### Step 3: Build APK
```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Step 4: Build AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease
```

The AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### Step 5: Sign the Build

For production, you need to sign the APK/AAB:

1. **Generate Keystore** (first time only):
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore gymie-release.keystore \
  -alias gymie-key \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

2. **Create `android/gradle.properties`**:
```properties
MYAPP_RELEASE_STORE_FILE=gymie-release.keystore
MYAPP_RELEASE_KEY_ALIAS=gymie-key
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

3. **Update `android/app/build.gradle`**:
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

4. **Build Signed APK**:
```bash
cd android
./gradlew assembleRelease
```

---

## Configuration Before Building

### 1. Update Package Name (Optional)

In [`app.json`](frontend/app.json:1):
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.gymie"
    }
  }
}
```

### 2. Update App Version

In [`app.json`](frontend/app.json:1):
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

Increment `versionCode` for each new build uploaded to Play Store.

### 3. Set API URL for Production

In `frontend/.env`:
```env
EXPO_PUBLIC_API_URL=https://api.yourapp.com/v1
```

Or set in [`app.json`](frontend/app.json:1):
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.yourapp.com/v1"
    }
  }
}
```

### 4. Configure Icons & Splash

Ensure these files exist:
- `assets/images/icon.png` (1024x1024)
- `assets/images/android-icon-foreground.png` (512x512)
- `assets/images/android-icon-background.png` (512x512)
- `assets/images/splash-icon.png` (400x400)

---

## Build Profiles Explained

### Development Profile
- **Purpose**: Testing with debugging tools
- **Output**: APK with development flags
- **Use**: Internal testing, debugging
- **Command**: `eas build --profile development --platform android`

### Preview Profile
- **Purpose**: Release-ready APK for testing
- **Output**: Signed APK
- **Use**: Beta testing, distribution outside Play Store
- **Command**: `eas build --profile preview --platform android`

### Production Profile
- **Purpose**: Play Store submission
- **Output**: Signed AAB
- **Use**: Official app releases
- **Command**: `eas build --profile production --platform android`

---

## Troubleshooting

### Build Failed: "ANDROID_HOME not set"
**Solution**: Use EAS Build (cloud) instead of local build.

### Build Failed: "Gradle error"
**Solution**:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

### APK Won't Install: "App not installed"
**Solutions**:
1. Uninstall previous version
2. Enable "Install from Unknown Sources"
3. Check if APK is signed (production builds)

### Build Takes Too Long
- EAS Build: Normal (15-30 minutes)
- Local Build: First time is slow, subsequent builds are faster

### ML Model Not Found Error
**Solution**: Ensure model files are copied:
```bash
cp ml-model/vision_v1.tflite android/app/src/main/assets/
cp ml-model/labels.json android/app/src/main/assets/
```

---

## Testing the Build

### Before Building:
1. Test on emulator/device via `npm run android`
2. Test all features work in release mode
3. Test with production API endpoint
4. Test ML inference works

### After Building:
1. Install APK on clean device
2. Test all critical flows:
   - Registration/Login
   - Workout tracking
   - Nutrition logging with camera
   - Progress tracking
3. Test offline functionality
4. Check app size (should be < 50MB)

---

## Distributing Your APK

### Internal Testing:
1. Share APK file directly via email/cloud storage
2. Use Firebase App Distribution
3. Use TestFlight (for iOS)

### Google Play Store:
1. Create developer account: https://play.google.com/console
2. Create app listing
3. Upload AAB file (from production build)
4. Fill in store listing details
5. Submit for review

---

## Quick Commands Reference

```bash
# Cloud build (recommended)
eas login
eas build --profile preview --platform android  # APK
eas build --profile production --platform android  # AAB

# Local build
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Install on device
adb install app-release.apk

# Check connected devices
adb devices

# View logs
adb logcat | grep "gymie"
```

---

## Next Steps

After successful build:
1. **Test thoroughly** on multiple devices
2. **Set up CI/CD** for automated builds
3. **Configure app signing** for Play Store
4. **Set up crash reporting** (Sentry, Firebase Crashlytics)
5. **Configure analytics** (Google Analytics, Amplitude)

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Build Guide](https://docs.expo.dev/build-reference/android-builds/)
- [Play Store Submission](https://docs.expo.dev/submit/android/)
- [App Signing](https://docs.expo.dev/app-signing/app-credentials/)

---

## Current Build Configuration

Your app is configured with:
- **Package Name**: `com.anonymous.Gymie`
- **Version**: `1.0.0`
- **Min SDK**: 34 (Android 14)
- **Native Modules**: TensorFlow Lite for ML
- **Build Tool**: EAS Build + Expo
