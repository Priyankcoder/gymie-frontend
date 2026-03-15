#!/bin/bash

# Gymie iOS Build Script
# This script helps you build and run your iOS app

set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$FRONTEND_DIR/ios"
BUNDLE_ID="com.anonymous.Gymie"
SCHEME="Gymie"
WORKSPACE="$IOS_DIR/Gymie.xcworkspace"

echo "🏋️ Gymie iOS Build Tool"
echo "========================"
echo ""

# Check if we're pointing to the right place
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "❌ Error: package.json not found at $FRONTEND_DIR"
    exit 1
fi

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ── Helpers ───────────────────────────────────────────────────────────────────

ensure_ios_project() {
    if [ ! -d "$IOS_DIR" ] || [ ! -f "$WORKSPACE" ]; then
        echo "📱 Generating iOS project..."
        cd "$FRONTEND_DIR"
        npx expo prebuild --platform ios
    fi
}

ensure_pods() {
    if [ ! -d "$IOS_DIR/Pods" ]; then
        echo "📦 Installing CocoaPods..."
        cd "$IOS_DIR"
        LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
        cd "$FRONTEND_DIR"
    fi
}

copy_ml_models() {
    echo "📄 Copying ML model files..."
    if [ -f "$FRONTEND_DIR/ml-model/vision_v1.tflite" ]; then
        cp "$FRONTEND_DIR/ml-model/vision_v1.tflite" "$IOS_DIR/Gymie/"
        echo "✅ Copied vision_v1.tflite"
    else
        echo "⚠️  vision_v1.tflite not found in ml-model/"
    fi
    if [ -f "$FRONTEND_DIR/ml-model/labels.json" ]; then
        cp "$FRONTEND_DIR/ml-model/labels.json" "$IOS_DIR/Gymie/"
        echo "✅ Copied labels.json"
    else
        echo "⚠️  labels.json not found in ml-model/"
    fi
}

clean_prebuild() {
    echo "🧹 Running clean prebuild..."
    cd "$FRONTEND_DIR"
    npx expo prebuild --clean --platform ios
    echo "📦 Installing CocoaPods..."
    cd "$IOS_DIR"
    LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
    cd "$FRONTEND_DIR"
    copy_ml_models
}

find_or_boot_simulator() {
    SIM_ID=$(xcrun simctl list devices booted 2>/dev/null \
        | grep -E "iPhone|iPad" | head -1 \
        | grep -oE '[A-F0-9-]{36}' | head -1)

    if [ -z "$SIM_ID" ]; then
        echo "⏳ No booted simulator found. Booting iPhone 17 Pro..."
        SIM_ID=$(xcrun simctl list devices available 2>/dev/null \
            | grep "iPhone 17 Pro" | grep -v "Max" | head -1 \
            | grep -oE '[A-F0-9-]{36}' | head -1)
        [ -z "$SIM_ID" ] && SIM_ID=$(xcrun simctl list devices available 2>/dev/null \
            | grep "iPhone" | head -1 \
            | grep -oE '[A-F0-9-]{36}' | head -1)
        [ -z "$SIM_ID" ] && { echo "❌ No iOS simulator found. Add one via Xcode ▸ Devices & Simulators."; exit 1; }
        xcrun simctl boot "$SIM_ID"
    fi

    SIM_NAME=$(xcrun simctl list devices 2>/dev/null \
        | grep "$SIM_ID" | sed 's/ (.*//' | xargs)
    echo "📱 Simulator: $SIM_NAME ($SIM_ID)"
}

xcodebuild_and_run_simulator() {
    local SIM_ID=$1
    echo ""
    echo "🔨 Building for simulator..."

    BUILD_LOG=$(mktemp)
    xcodebuild \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration Debug \
        -sdk iphonesimulator \
        -destination "platform=iOS Simulator,id=$SIM_ID" \
        CODE_SIGNING_ALLOWED=NO \
        build > "$BUILD_LOG" 2>&1

    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Build failed. Errors:"
        grep -E "error:" "$BUILD_LOG" | head -30
        rm "$BUILD_LOG"
        exit 1
    fi
    rm "$BUILD_LOG"
    echo "✅ Build succeeded!"

    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
        -name "Gymie.app" -path "*Debug-iphonesimulator*" 2>/dev/null | head -1)
    [ -z "$APP_PATH" ] && { echo "❌ Built .app not found in DerivedData."; exit 1; }

    echo "📲 Installing on simulator..."
    xcrun simctl install "$SIM_ID" "$APP_PATH"

    echo "🚀 Launching Gymie..."
    open -a Simulator
    xcrun simctl launch "$SIM_ID" "$BUNDLE_ID"

    echo ""
    echo "✅ App launched on simulator!"
    echo "💡 Start Metro in a separate terminal: npm start"
}

xcodebuild_device() {
    local CONFIG=$1   # Debug or Release
    echo ""
    echo "🔨 Building $CONFIG for device..."
    echo "⚠️  Make sure your Apple ID team is set in Xcode Signing & Capabilities."
    echo ""

    BUILD_LOG=$(mktemp)
    xcodebuild \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration "$CONFIG" \
        -sdk iphoneos \
        -destination "generic/platform=iOS" \
        -allowProvisioningUpdates \
        build > "$BUILD_LOG" 2>&1

    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Build failed. Errors:"
        grep -E "error:" "$BUILD_LOG" | head -30
        rm "$BUILD_LOG"
        echo ""
        echo "💡 Fix signing: open Gymie.xcworkspace in Xcode → Signing & Capabilities → set your Team"
        exit 1
    fi
    rm "$BUILD_LOG"
    echo "✅ Build succeeded!"

    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
        -name "Gymie.app" -path "*${CONFIG}-iphoneos*" 2>/dev/null | head -1)
    [ -z "$APP_PATH" ] && { echo "❌ Built .app not found in DerivedData."; exit 1; }

    echo ""
    echo "📦 App location: $APP_PATH"
    echo ""
    echo "📲 Installing on connected iPhone..."
    xcrun devicectl device install app --device first "$APP_PATH" 2>/dev/null \
        || ios-deploy --bundle "$APP_PATH" 2>/dev/null \
        || echo "⚠️  Auto-install failed. Drag $APP_PATH into Xcode Devices window to install manually."

    echo ""
    if [ "$CONFIG" == "Debug" ]; then
        echo "✅ Debug app installed! Connect to Metro on the same WiFi: npm start"
    else
        echo "✅ Release app installed! No Metro needed — JS is bundled into the app."
    fi
    echo ""
    echo "💡 First launch: Settings → General → VPN & Device Management → Trust your Apple ID"
}

# ── Main menu ─────────────────────────────────────────────────────────────────

echo "📋 Select build method:"
echo "1) Local Build (Xcode required)"
echo "2) EAS Build (Cloud — no signing setup needed)"
read -p "Enter choice (1-2): " BUILD_METHOD

case $BUILD_METHOD in
    1)
        echo ""
        echo "🔧 Local Build"
        echo "=============="
        echo ""

        echo "📋 Select build type:"
        echo "1) Simulator — Debug          Run app on iOS Simulator. Metro required for JS (npm start)."
        echo "2) Simulator — Debug (clean)  Same as above but wipes ios/ and reinstalls Pods from scratch."
        echo "3) Device    — Debug          Install on your iPhone. Needs Metro running on the same WiFi."
        echo "4) Device    — Release        Install on your iPhone. JS bundled in — no Metro needed."
        read -p "Enter choice (1-4): " BUILD_TYPE

        case $BUILD_TYPE in
            1)
                ensure_ios_project
                ensure_pods
                copy_ml_models
                find_or_boot_simulator
                xcodebuild_and_run_simulator "$SIM_ID"
                ;;
            2)
                clean_prebuild
                find_or_boot_simulator
                xcodebuild_and_run_simulator "$SIM_ID"
                ;;
            3)
                ensure_ios_project
                ensure_pods
                copy_ml_models
                xcodebuild_device "Debug"
                ;;
            4)
                ensure_ios_project
                ensure_pods
                copy_ml_models
                xcodebuild_device "Release"
                ;;
            *)
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac
        ;;

    2)
        echo ""
        echo "☁️  EAS Cloud Build"
        echo "=================="
        echo ""

        if ! command_exists eas; then
            echo "📦 Installing EAS CLI..."
            npm install -g eas-cli
        fi

        echo "🔐 Checking EAS login..."
        if ! eas whoami >/dev/null 2>&1; then
            echo "Please log in to your Expo account:"
            eas login
        fi

        echo ""
        echo "📋 Select build profile:"
        echo "1) Development  (dev client, internal distribution)"
        echo "2) Preview      (standalone IPA, internal distribution)"
        echo "3) Production   (App Store)"
        read -p "Enter choice (1-3): " PROFILE_CHOICE

        cd "$FRONTEND_DIR"

        case $PROFILE_CHOICE in
            1)
                echo ""
                echo "🔨 Building development client..."
                echo "This will take 15-30 minutes on EAS servers."
                eas build --profile development --platform ios
                ;;
            2)
                echo ""
                echo "🔨 Building preview IPA..."
                echo "This will take 15-30 minutes on EAS servers."
                eas build --profile preview --platform ios
                ;;
            3)
                echo ""
                echo "🔨 Building production IPA for App Store..."
                echo "This will take 15-30 minutes on EAS servers."
                eas build --profile production --platform ios
                ;;
            *)
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac

        echo ""
        echo "✅ Build submitted to EAS!"
        echo ""
        echo "📥 To download your build:"
        echo "   1. Visit: https://expo.dev"
        echo "   2. Go to your project builds"
        echo "   3. Download the IPA when ready"
        echo ""
        echo "   Or run: eas build:list"
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see DEVELOPMENT_BUILD_GUIDE.md"
echo ""
