
#!/bin/bash

# Script to set up Android environment variables for Gymie

echo "🤖 Android Environment Setup for Gymie"
echo "========================================"
echo ""

# Detect shell
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    echo "❌ Could not find .zshrc or .bashrc"
    exit 1
fi

echo "📝 Detected shell config: $SHELL_CONFIG"
echo ""

# Android SDK path
ANDROID_SDK="$HOME/Library/Android/sdk"

# Check if Android SDK exists
if [ ! -d "$ANDROID_SDK" ]; then
    echo "❌ Android SDK not found at $ANDROID_SDK"
    echo "   Please install Android Studio first"
    exit 1
fi

echo "✅ Found Android SDK at $ANDROID_SDK"
echo ""

# Check if already configured
if grep -q "ANDROID_HOME" "$SHELL_CONFIG"; then
    echo "⚠️  ANDROID_HOME already configured in $SHELL_CONFIG"
    read -p "Do you want to update it? (y/n): " UPDATE
    if [ "$UPDATE" != "y" ]; then
        echo "Skipping environment setup"
        exit 0
    fi
    # Remove old configuration
    sed -i.bak '/ANDROID_HOME/d' "$SHELL_CONFIG"
    sed -i.bak '/Android SDK/d' "$SHELL_CONFIG"
fi

# Add Android environment variables
echo "📝 Adding Android environment variables to $SHELL_CONFIG..."
cat >> "$SHELL_CONFIG" << 'EOF'

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
EOF

echo "✅ Environment variables added"
echo ""
echo "🔄 Reloading shell configuration..."
source "$SHELL_CONFIG"

# Verify
echo ""
echo "✅ Setup complete!"
echo ""
echo "Verification:"
echo "  ANDROID_HOME: $ANDROID_HOME"
echo "  ADB available: $(command -v adb > /dev/null && echo "✅ Yes" || echo "❌ No")"
echo ""
echo "📚 Next steps:"
echo "  1. Close and reopen your terminal (or run: source $SHELL_CONFIG)"
echo "  2. Open Android Studio"
echo "  3. Create an Android emulator (see ANDROID_SETUP.md)"
echo "  4. Run: npm run android"
echo ""
