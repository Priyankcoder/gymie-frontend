
#!/bin/bash

echo "🔍 Finding model in Downloads..."

# Find the model file
MODEL_NAME="lite-model_aiy_vision_classifier_food_V1_1.tflite"
DOWNLOADS_PATH="$HOME/Downloads/$MODEL_NAME"

if [ ! -f "$DOWNLOADS_PATH" ]; then
    echo "❌ Model not found at: $DOWNLOADS_PATH"
    echo ""
    echo "Please provide the full path to the model:"
    read -p "Path: " DOWNLOADS_PATH
    
    if [ ! -f "$DOWNLOADS_PATH" ]; then
        echo "❌ File not found: $DOWNLOADS_PATH"
        exit 1
    fi
fi

echo "✅ Found model: $DOWNLOADS_PATH"

# Backup old model
if [ -f "vision_v1.tflite" ]; then
    echo "📦 Backing up old model..."
    mv vision_v1.tflite vision_v1.tflite.backup
    echo "   Backed up to: vision_v1.tflite.backup"
fi

# Copy model to ml-model folder
echo "📁 Copying model to project..."
cp "$DOWNLOADS_PATH" vision_v1.tflite
echo "✅ Copied to: frontend/ml-model/vision_v1.tflite"

# Copy to Android assets
ANDROID_ASSETS="../android/app/src/main/assets"
if [ -d "$ANDROID_ASSETS" ]; then
    echo "📱 Copying to Android assets..."
    cp vision_v1.tflite "$ANDROID_ASSETS/vision_v1.tflite"
    echo "✅ Copied to: $ANDROID_ASSETS/vision_v1.tflite"
else
    echo "⚠️  Android assets folder not found: $ANDROID_ASSETS"
    echo "   You'll need to copy manually later"
fi

echo ""
echo "="*70
echo "✅ MODEL MOVED SUCCESSFULLY!"
echo "="*70
echo ""
echo "📝 Next steps:"
echo "1. Test the model:"
echo "   python test_model_complete.py"
echo ""
echo "2. If tests show good results (>70% confidence):"
echo "   cd .."
echo "   npm run android"
echo ""
echo "3. Test food recognition in the app!"

# Check file size
SIZE=$(ls -lh vision_v1.tflite | awk '{print $5}')
echo ""
echo "📦 Model file size: $SIZE"
