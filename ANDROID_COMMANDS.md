
# Android Development Commands Reference

Quick reference for Android development commands in `package.json`.

## 🏗️ Building

### Build with Script (Recommended)
```bash
npm run android:build
```
Runs the interactive `build-android.sh` script that:
- Checks for running emulator
- Auto-starts emulator if needed
- Builds debug APK
- Installs on emulator
- Launches the app

### Build Debug APK
```bash
npm run android:build-debug
```
Builds debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK
```bash
npm run android:build-release
```
Builds release APK (unsigned): `android/app/build/outputs/apk/release/app-release.apk`

### Clean Build
```bash
npm run android:clean
```
Cleans the Android build cache

## 📱 Installation

### Install Debug APK
```bash
npm run android:install
```
Installs the debug APK on connected device/emulator

### Install Release APK
```bash
npm run android:install-release
```
Installs the release APK on connected device/emulator

### Uninstall App
```bash
npm run android:uninstall
```
Removes Gymie app from device/emulator

## 🔍 Debugging

### View Devices
```bash
npm run android:devices
```
Lists all connected Android devices and emulators

### View All Logs
```bash
npm run android:logcat
```
Shows all Android system logs (use Ctrl+C to stop)

### View App Logs Only
```bash
npm run android:logcat-app
```
Shows only Gymie app logs (filtered)

### Reverse Port
```bash
npm run android:reverse-port
```
Maps device port 8080 to host port 8080 (for API access)

### Open Dev Menu
```bash
npm run android:shake
```
Opens React Native dev menu (simulates device shake)

## 🚀 Emulator

### List Available Emulators
```bash
npm run android:emulator-list
```
Lists all Android Virtual Devices (AVDs)

### Open Android Studio
```bash
npm run android:studio
```
Opens the Android project in Android Studio

## 🔄 Common Workflows

### Quick Development Cycle
```bash
# 1. Start Metro bundler
npm start

# 2. In another terminal, build and install
npm run android:build

# 3. View logs (optional)
npm run android:logcat-app
```

### Debug Issues
```bash
# 1. Check connected devices
npm run android:devices

# 2. Check logs
npm run android:logcat-app

# 3. Reverse port for API
npm run android:reverse-port

# 4. Open dev menu
npm run android:shake
```

### Fresh Build
```bash
# 1. Clean previous build
npm run android:clean

# 2. Uninstall old app
npm run android:uninstall

# 3. Build and install fresh
npm run android:build
```

### Release Build
```bash
# 1. Build release APK
npm run android:build-release

# 2. Sign the APK (manual step)
# See ANDROID_BUILD_GUIDE.md for signing instructions

# 3. Install signed APK
npm run android:install-release
```

## 💡 Tips

### Keyboard Shortcuts
- **Reload JS**: Press `r` twice in Metro terminal
- **Dev Menu**: `npm run android:shake` or press `Cmd+M` (Mac) / `Ctrl+M` (Windows/Linux)
- **Toggle Inspector**: `Cmd+I` (Mac) / `Ctrl+I` (Windows/Linux)

### Troubleshooting

**"No devices found"**
```bash
npm run android:devices
# If empty, start an emulator in Android Studio
```

**Port already in use**
```bash
# Kill process on port 8081 (Metro)
lsof -ti:8081 | xargs kill -9

# Kill process on port 8080 (Backend)
lsof -ti:8080 | xargs kill -9
```

**Can't connect to backend**
```bash
npm run android:reverse-port
```

**App won't reload**
```bash
npm run android:shake  # Open dev menu
# Select "Reload"
```

**Build fails**
```bash
npm run android:clean
cd android && ./gradlew --stop && cd ..
npm run android:build-debug
```

## 📚 Related Documentation

- [`build-android.sh`](./build-android.sh) - Interactive build script
- [`ANDROID_BUILD_GUIDE.md`](./ANDROID_BUILD_GUIDE.md) - Complete build guide
- [`DEVELOPMENT_BUILD_GUIDE.md`](./DEVELOPMENT_BUILD_GUIDE.md) - Development setup

## 🔗 Quick Links

| Command | Description |
|---------|-------------|
| `npm run android:build` | 🏗️ Build, install, and launch (one command) |
| `npm run android:devices` | 📱 Check connected devices |
| `npm run android:logcat-app` | 📋 View app logs |
| `npm run android:shake` | 🔧 Open dev menu |
| `npm run android:clean` | 🧹 Clean build cache |
| `npm run android:uninstall` | 🗑️ Remove app |

---

**Need help?** Check the full documentation in [`ANDROID_BUILD_GUIDE.md`](./ANDROID_BUILD_GUIDE.md)
