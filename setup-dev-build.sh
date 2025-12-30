
#!/bin/bash

# Gymie Development Build Setup Script
# This script sets up the development build for Android and iOS

set -e  # Exit on error

echo "🏋️ Gymie Development Build Setup"
echo "=================================="
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

# Detect platform
PLATFORM=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
else
    echo "❌ Unsupported platform: $OSTYPE"
    exit 1
fi

echo "📱 Detected platform: $PLATFORM"
echo ""

# Ask user which platform to build for
echo "Which platform do you want to build for?"
echo "1) Android only"
echo "2) iOS only (macOS only)"
echo "3) Both Android and iOS (macOS only)"
read -p "Enter choice (1-3): " CHOICE

BUILD_ANDROID=false
BUILD_IOS=false

case $CHOICE in
    1)
        BUILD_ANDROID=true
        ;;
    2)
        if [ "$PLATFORM" != "macos" ]; then
            echo "❌ iOS builds are only supported on macOS"
            exit 1
        fi
        BUILD_IOS=true
        ;;
    3)
        if [ "$PLATFORM" != "macos" ]; then
            echo "❌ iOS builds are only supported on macOS"
            exit 1
        fi
        BUILD_ANDROID=true
        BUILD_IOS=true
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
if [ -d "android" ]; then
    rm -rf android
    echo "✅ Removed android directory"
fi
if [ -d "ios" ]; then
    rm -rf ios
    echo "✅ Removed ios directory"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Prebuild for Android
if [ "$BUILD_ANDROID" = true ]; then
    echo ""
    echo "🤖 Setting up Android project..."
    
    # Check for required tools
    if ! command_exists java; then
        echo "⚠️  Warning: Java not found. Please install JDK 17 or higher"
    fi
    
    npx expo prebuild --platform android
    
    # Copy ML model files
    echo "📄 Copying ML model files to Android assets..."
    mkdir -p android/app/src/main/assets
    cp ml-model/vision_v1.tflite android/app/src/main/assets/ 2>/dev/null || echo "⚠️  vision_v1.tflite not found"
    cp ml-model/labels.json android/app/src/main/assets/ 2>/dev/null || echo "⚠️  labels.json not found"
    
    echo "✅ Android setup complete!"
fi

# Prebuild for iOS
if [ "$BUILD_IOS" = true ]; then
    echo ""
    echo "🍎 Setting up iOS project..."
    
    # Check for required tools
    if ! command_exists pod; then
        echo "❌ CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    
    npx expo prebuild --platform ios
    
    # Install pods
    echo "📦 Installing CocoaPods dependencies..."
    cd ios
    pod install
    cd ..
    
    # Copy ML model files
    echo "📄 Copying ML model files to iOS..."
    mkdir -p ios/gymie
    cp ml-model/vision_v1.tflite ios/gymie/ 2>/dev/null || echo "⚠️  vision_v1.tflite not found"
    cp ml-model/labels.json ios/gymie/ 2>/dev/null || echo "⚠️  labels.json not found"
    
    echo "✅ iOS setup complete!"
fi

echo ""
echo "🎉 Development build setup complete!"
echo ""
echo "📚 Next steps:"
echo ""

if [ "$BUILD_ANDROID" = true ]; then
    echo "For Android:"
    echo "  1. Open Android Studio"
    echo "  2. Open the 'android' folder"
    echo "  3. Wait for Gradle sync"
    echo "  4. Click Run (or: npm run android)"
    echo ""
fi

if [ "$BUILD_IOS" = true ]; then
    echo "For iOS:"
    echo "  1. Open Xcode"
    echo "  2. Open 'ios/gymie.xcworkspace' (not .xcodeproj!)"
    echo "  3. Select your device/simulator"
    echo "  4. Click Run (or: npm run ios)"
    echo ""
fi

echo "📖 For detailed instructions, see DEVELOPMENT_BUILD_GUIDE.md"
echo ""
