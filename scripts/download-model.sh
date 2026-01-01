
#!/bin/bash

# Download Google AIY Food Classification Model
# This script helps download the TensorFlow Lite model for food classification

ASSETS_DIR="android/app/src/main/assets"
MODEL_FILE="vision_v1.tflite"

echo "Google AIY Food Classification Model Setup"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: The model file needs to be downloaded manually"
echo ""
echo "Steps:"
echo "1. Download the model from TensorFlow Hub:"
echo "   https://tfhub.dev/google/aiy/vision/classifier/food_V1/1"
echo ""
echo "2. Click 'Download' button to get the .tflite file"
echo ""
echo "3. Save it as: $ASSETS_DIR/$MODEL_FILE"
echo ""
echo "OR use this command if you have the file in Downloads:"
echo "   cp ~/Downloads/1.tflite $ASSETS_DIR/$MODEL_FILE"
echo ""

# Check if model already exists
if [ -f "$ASSETS_DIR/$MODEL_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$ASSETS_DIR/$MODEL_FILE" 2>/dev/null || stat -c%s "$ASSETS_DIR/$MODEL_FILE" 2>/dev/null)
    FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
    
    if [ $FILE_SIZE_MB -gt 15 ]; then
        echo "✅ Model file already exists and looks correct!"
        echo "   Location: $ASSETS_DIR/$MODEL_FILE"
        echo "   Size: ${FILE_SIZE_MB}MB"
        echo ""
        echo "You're ready to build the app!"
        exit 0
    else
        echo "❌ Model file exists but seems incorrect (only ${FILE_SIZE_MB}MB)"
        echo "   Expected: ~20MB"
        echo "   Please re-download from TensorFlow Hub"
        exit 1
    fi
else
    echo "❌ Model file not found at: $ASSETS_DIR/$MODEL_FILE"
    echo "   Please follow the steps above to download it"
    exit 1
fi
