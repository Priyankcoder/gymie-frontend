
#!/bin/bash

# Gymie Android Build Script
# This script helps you build and export your Android app

set -e  # Exit on error

echo "🏋️ Gymie Android Build Tool"
echo "============================"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

echo "📋 Select build method:"
echo "1) EAS Build (Cloud - Recommended, no Android Studio needed)"
echo "2) Local Build (Requires Android Studio)"
read -p "Enter choice (1-2): " BUILD_METHOD

case $BUILD_METHOD in
    1)
        echo ""
        echo "🌩️ Cloud Build with EAS"
        echo "========================"
        echo ""
        
        # Check if EAS CLI is installed
        if ! command_exists eas; then
            echo "📦 Installing EAS CLI..."
            npm install -g eas-cli
        fi
        
        # Check if user is logged in
        echo "🔐 Checking EAS login..."
        if ! eas whoami >/dev/null 2>&1; then
            echo "Please log in to your Expo account:"
            eas login
        fi
        
        echo ""
        echo "📋 Select build profile:"
        echo "1) Preview (APK - for testing/distribution)"
        echo "2) Production (AAB - for Google Play Store)"
        read -p "Enter choice (1-2): " PROFILE_CHOICE
        
        case $PROFILE_CHOICE in
            1)
                PROFILE="preview"
                echo ""
                echo "🔨 Building preview APK..."
                echo "This will take 15-30 minutes"
                eas build --profile preview --platform android
                ;;
            2)
                PROFILE="production"
                echo ""
                echo "🔨 Building production AAB..."
                echo "This will take 15-30 minutes"
                eas build --profile production --platform android
                ;;
            *)
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac
        
        echo ""
        echo "✅ Build submitted successfully!"
        echo ""
        echo "📥 To download your build:"
        echo "1. Visit: https://expo.dev"
        echo "2. Go to your project builds"
        echo "3. Download the APK/AAB when ready"
        echo ""
        echo "Or run: eas build:list"
        ;;
        
    2)
        echo ""
        echo "🔧 Local Build"
        echo "=============="
        echo ""
        
        # Check for Android Studio
        if [ -z "$ANDROID_HOME" ]; then
            echo "❌ ANDROID_HOME not set. Please install Android Studio"
            echo "See ANDROID_SETUP.md for setup instructions"
            exit 1
        fi
        
        # Check if android directory exists
        if [ ! -d "android" ]; then
            echo "📱 Generating Android project..."
            npx expo prebuild --platform android
        fi
        
        # Copy ML model files
        echo "📄 Copying ML model files..."
        mkdir -p android/app/src/main/assets
        if [ -f "ml-model/vision_v1.tflite" ]; then
            cp ml-model/vision_v1.tflite android/app/src/main/assets/
            echo "✅ Copied vision_v1.tflite"
        else
            echo "⚠️  vision_v1.tflite not found in ml-model/"
        fi
        
        if [ -f "ml-model/labels.json" ]; then
            cp ml-model/labels.json android/app/src/main/assets/
            echo "✅ Copied labels.json"
        else
            echo "⚠️  labels.json not found in ml-model/"
        fi
        
        echo ""
        echo "📋 Select build type:"
        echo "1) Debug APK (unsigned, for testing)"
        echo "2) Release APK (requires signing)"
        echo "3) Release AAB (for Play Store, requires signing)"
        read -p "Enter choice (1-3): " BUILD_TYPE
        
        cd android
        
        case $BUILD_TYPE in
            1)
                echo ""
                echo "🔨 Building debug APK..."
                ./gradlew assembleDebug
                
                OUTPUT_PATH="app/build/outputs/apk/debug/app-debug.apk"
                if [ -f "$OUTPUT_PATH" ]; then
                    echo ""
                    echo "✅ Build successful!"
                    echo "📦 APK location: android/$OUTPUT_PATH"
                    echo ""
                    
                    # Check for running emulators
                    echo "📱 Checking for Android emulator..."
                    RUNNING_EMULATORS=$(adb devices | grep -c "emulator")
                    
                    if [ "$RUNNING_EMULATORS" -eq 0 ]; then
                        echo "⚠️  No emulator running. Starting emulator..."
                        
                        # List available AVDs
                        if [ ! -f "$ANDROID_HOME/emulator/emulator" ]; then
                            echo "❌ Emulator not found at $ANDROID_HOME/emulator/emulator"
                            exit 1
                        fi
                        
                        AVDS=$($ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null)
                        
                        if [ -z "$AVDS" ]; then
                            echo "❌ No Android Virtual Devices found."
                            echo "Please create an AVD in Android Studio first:"
                            echo "Tools → Device Manager → Create Device"
                            exit 1
                        fi
                        
                        # Get first AVD
                        FIRST_AVD=$(echo "$AVDS" | head -n 1)
                        echo "🚀 Starting emulator: $FIRST_AVD"
                        
                        # Export library path for macOS
                        export DYLD_LIBRARY_PATH="$ANDROID_HOME/emulator/lib64:$ANDROID_HOME/emulator/lib64/qt/lib"
                        
                        # Start emulator in background with proper settings
                        nohup "$ANDROID_HOME/emulator/emulator" -avd "$FIRST_AVD" -netdelay none -netspeed full > /dev/null 2>&1 &
                        EMULATOR_PID=$!
                        
                        # Wait for device to be detected
                        echo "⏳ Waiting for emulator to start (this may take 1-2 minutes)..."
                        timeout=120
                        elapsed=0
                        while [ $elapsed -lt $timeout ]; do
                            if adb devices | grep -q "emulator"; then
                                break
                            fi
                            sleep 2
                            elapsed=$((elapsed + 2))
                        done
                        
                        if [ $elapsed -ge $timeout ]; then
                            echo "❌ Emulator failed to start within timeout"
                            exit 1
                        fi
                        
                        # Wait for boot to complete
                        echo "⏳ Waiting for emulator to fully boot..."
                        adb wait-for-device
                        
                        while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
                            sleep 2
                        done
                        
                        # Give it a few more seconds to fully initialize
                        sleep 5
                        
                        echo "✅ Emulator ready!"
                    else
                        echo "✅ Found running emulator"
                    fi
                    
                    # Install APK
                    echo ""
                    echo "📲 Installing APK on emulator..."
                    adb install -r "$OUTPUT_PATH"
                    
                    if [ $? -eq 0 ]; then
                        echo "✅ APK installed successfully!"
                        
                        # Get package name from build.gradle
                        PACKAGE_NAME=$(grep "applicationId" app/build.gradle | sed 's/.*"\(.*\)".*/\1/' | tr -d ' ')
                        
                        if [ -n "$PACKAGE_NAME" ]; then
                            echo ""
                            echo "🚀 Launching app..."
                            adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
                            
                            echo ""
                            echo "✅ App launched in emulator!"
                            echo ""
                            echo "💡 You can now interact with your app in the emulator"
                            echo "💡 To view logs: adb logcat"
                        fi
                    else
                        echo "❌ Failed to install APK"
                        echo "Try manually: adb install -r $OUTPUT_PATH"
                    fi
                fi
                ;;
            2)
                echo ""
                echo "🔨 Building release APK..."
                ./gradlew assembleRelease
                
                OUTPUT_PATH="app/build/outputs/apk/release/app-release.apk"
                if [ -f "$OUTPUT_PATH" ]; then
                    echo ""
                    echo "✅ Build successful!"
                    echo "📦 APK location: android/$OUTPUT_PATH"
                    echo ""
                    echo "⚠️  This APK needs to be signed for distribution"
                fi
                ;;
            3)
                echo ""
                echo "🔨 Building release AAB..."
                ./gradlew bundleRelease
                
                OUTPUT_PATH="app/build/outputs/bundle/release/app-release.aab"
                if [ -f "$OUTPUT_PATH" ]; then
                    echo ""
                    echo "✅ Build successful!"
                    echo "📦 AAB location: android/$OUTPUT_PATH"
                    echo ""
                    echo "⚠️  This AAB needs to be signed for Play Store"
                fi
                ;;
            *)
                echo "❌ Invalid choice"
                cd ..
                exit 1
                ;;
        esac
        
        cd ..
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see:"
echo "   - ANDROID_BUILD_GUIDE.md"
echo "   - DEVELOPMENT_BUILD_GUIDE.md"
echo ""
