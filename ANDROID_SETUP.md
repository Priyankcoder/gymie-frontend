
# Android Development Setup for Gymie

## Step 1: Set up ANDROID_HOME

Add these lines to your `~/.zshrc` file:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload your shell:
```bash
source ~/.zshrc
```

Verify it's set:
```bash
echo $ANDROID_HOME
# Should output: /Users/priyank.rastogi@zomato.com/Library/Android/sdk
```

## Step 2: Create an Android Emulator

### Using Android Studio (Recommended):

1. **Open Android Studio**
2. **Click "Device Manager"** (phone icon in the toolbar)
3. **Click "Create Device"** (+ icon)
4. **Select a Device:**
   - Choose "Pixel 5" or "Pixel 7" (recommended)
   - Click "Next"
5. **Select System Image:**
   - Choose "Android 14 (API 34)" - UpsideDownCake
   - If not downloaded, click "Download" next to it
   - Click "Next"
6. **Configure AVD:**
   - Name: "Pixel_5_API_34" (or your preferred name)
   - Click "Show Advanced Settings" (optional):
     - RAM: 2048 MB minimum
     - Internal Storage: 2048 MB minimum
   - Click "Finish"

7. **Start the Emulator:**
   - In Device Manager, click the ▶️ play button next to your emulator
   - Wait for it to boot (first boot takes 2-3 minutes)

### Using Command Line:

```bash
# List available system images
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list | grep system-images

# Create an emulator (after downloading system image)
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd \
  -n Pixel_5_API_34 \
  -k "system-images;android-34;google_apis;arm64-v8a" \
  -d "pixel_5"

# Start the emulator
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_34 &
```

## Step 3: Run Your App

Once the emulator is running:

```bash
cd frontend
npm run android
```

Or build directly with Gradle:
```bash
cd frontend/android
./gradlew installDebug
```

## Common Issues

### Issue: "adb: command not found"
**Solution:** Ensure ANDROID_HOME is set and platform-tools is in PATH:
```bash
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Issue: "No emulators found"
**Solution:** Create an emulator using Android Studio or command line (see above)

### Issue: "Build failed: Could not find Node"
**Solution:** Already fixed in `gradle.properties` with Node path

### Issue: "Emulator won't start"
**Solution:** 
```bash
# Enable hardware acceleration (if on Mac with Apple Silicon)
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_34 -gpu auto
```

### Issue: "App installs but crashes"
**Solution:** Check logs:
```bash
# View Android logs
npx react-native log-android
# Or
adb logcat | grep "gymie"
```

## Verify Setup

Run these commands to verify everything is working:

```bash
# Check Java
java -version
# Should show: openjdk version "17.0.17"

# Check Android SDK
echo $ANDROID_HOME
# Should output: /Users/priyank.rastogi@zomato.com/Library/Android/sdk

# Check ADB
adb devices
# Should list your emulator or device

# Check emulators
$ANDROID_HOME/emulator/emulator -list-avds
# Should list your created emulators
```

## Quick Start Script

Save this as `start-android.sh` in the frontend directory:

```bash
#!/bin/bash
# Start Android emulator and run app

echo "🤖 Starting Android Emulator..."
$ANDROID_HOME/emulator/emulator -avd Pixel_5_API_34 &

echo "⏳ Waiting for emulator to boot..."
adb wait-for-device

echo "🚀 Starting Metro bundler..."
npm start &

echo "⏳ Waiting 5 seconds for Metro to start..."
sleep 5

echo "📱 Installing app..."
npm run android

echo "✅ Done! App should be running on emulator"
```

Make it executable:
```bash
chmod +x start-android.sh
```

Run it:
```bash
./start-android.sh
```

## Next Steps

After successfully running the app:
1. Test camera functionality
2. Test ML model with food images
3. Test offline database
4. Test nutrition tracking features
