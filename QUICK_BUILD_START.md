
# Quick Start: Build Android App

## 🚀 Fastest Way to Build

### Option 1: Cloud Build (Recommended - No Android Studio Needed)

```bash
cd frontend

# Install EAS CLI (first time only)
npm install -g eas-cli

# Login to Expo
eas login

# Build APK for testing/distribution
eas build --profile preview --platform android

# OR build AAB for Google Play Store
eas build --profile production --platform android
```

**Build time**: 15-30 minutes (runs on Expo's servers)

**Download your build**:
- You'll get a URL when the build completes
- Or visit: https://expo.dev → Your Projects → Gymie → Builds

---

### Option 2: Using the Build Script

```bash
cd frontend
./build-android.sh
```

Follow the interactive prompts to:
1. Choose cloud or local build
2. Select build profile (preview/production)
3. Wait for the build to complete

---

### Option 3: Local Build (Requires Android Studio)

```bash
cd frontend

# Generate Android project
npx expo prebuild --platform android

# Copy ML model files
mkdir -p android/app/src/main/assets
cp ml-model/vision_v1.tflite android/app/src/main/assets/
cp ml-model/labels.json android/app/src/main/assets/

# Build APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📥 Installing the APK

Once you have the APK file:

### On Connected Device:
```bash
adb install path/to/app.apk
```

### Via File Transfer:
1. Copy APK to your phone
2. Open the file on your phone
3. Allow installation from unknown sources
4. Install the app

---

## 🔧 Before Building

### 1. Update Package Name (Optional)
Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.gymie"
    }
  }
}
```

### 2. Set Production API URL
Create/Edit `.env`:
```env
EXPO_PUBLIC_API_URL=https://api.yourapp.com/v1
```

### 3. Check ML Model Files
Ensure these exist:
- `ml-model/vision_v1.tflite`
- `ml-model/labels.json`

---

## 📱 Build Types Explained

| Build Type | File Type | Size | Use Case |
|------------|-----------|------|----------|
| **Preview** | APK | ~30-50MB | Testing, beta distribution |
| **Production** | AAB | ~20-30MB | Google Play Store submission |
| **Debug** | APK | ~50-70MB | Development, debugging |

---

## 🐛 Common Issues

### "EAS CLI not found"
```bash
npm install -g eas-cli
```

### "Not logged in to EAS"
```bash
eas login
```

### "ANDROID_HOME not set" (local build only)
Use cloud build instead, or see `ANDROID_SETUP.md`

### "ML model not found"
```bash
# Check if files exist
ls ml-model/
# Should show: vision_v1.tflite and labels.json
```

---

## ✅ Verification Checklist

Before building:
- [ ] App runs successfully via `npm run android`
- [ ] All features work (camera, ML, workouts, nutrition)
- [ ] Production API URL is set
- [ ] ML model files are present
- [ ] App version is updated in `app.json`

After building:
- [ ] APK installs on device
- [ ] App launches without crashes
- [ ] Camera/ML inference works
- [ ] Data persists after app restart
- [ ] Offline mode works

---

## 🚢 Ready to Build?

**Quick Commands:**

```bash
# Cloud build (easiest)
cd frontend
eas build --profile preview --platform android

# Using script (interactive)
cd frontend
./build-android.sh

# Check build status
eas build:list
```

---

## 📚 Detailed Documentation

- **Complete Build Guide**: [`ANDROID_BUILD_GUIDE.md`](ANDROID_BUILD_GUIDE.md:1)
- **Android Setup**: [`ANDROID_SETUP.md`](ANDROID_SETUP.md:1)
- **Development Guide**: [`DEVELOPMENT_BUILD_GUIDE.md`](DEVELOPMENT_BUILD_GUIDE.md:1)

---

## 🆘 Need Help?

1. Check the detailed guides above
2. View EAS Build docs: https://docs.expo.dev/build/introduction/
3. Check build logs at: https://expo.dev/accounts/[your-account]/projects/Gymie/builds
