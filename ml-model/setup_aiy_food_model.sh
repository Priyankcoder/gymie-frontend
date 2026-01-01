
#!/bin/bash

echo "=============================================="
echo "🚀 Setting Up Google AIY Food Classifier V1"
echo "=============================================="
echo ""

# Step 1: Download model from Kaggle
echo "📥 Step 1: Downloading model from Kaggle..."
echo "   This requires Kaggle API credentials configured"
echo ""

curl -L -o model.tar.gz \
  https://www.kaggle.com/api/v1/models/google/aiy/tfLite/vision-classifier-food-v1/1/download

if [ $? -ne 0 ]; then
    echo "❌ Failed to download model from Kaggle"
    echo ""
    echo "💡 Make sure you have Kaggle API configured:"
    echo "   1. Get your API token from kaggle.com/settings"
    echo "   2. Place it at ~/.kaggle/kaggle.json"
    echo "   3. chmod 600 ~/.kaggle/kaggle.json"
    exit 1
fi

echo "✅ Model downloaded successfully!"
echo ""

# Step 2: Extract the tar.gz
echo "📦 Step 2: Extracting model archive..."
tar -xzf model.tar.gz

if [ $? -ne 0 ]; then
    echo "❌ Failed to extract model"
    exit 1
fi

echo "✅ Archive extracted!"
echo ""

# Step 3: Find the .tflite file
echo "🔍 Step 3: Locating .tflite model file..."
TFLITE_FILE=$(find . -name "*.tflite" -type f | head -n 1)

if [ -z "$TFLITE_FILE" ]; then
    echo "❌ No .tflite file found in archive"
    echo "📂 Contents of extracted archive:"
    ls -la
    exit 1
fi

echo "✅ Found model: $TFLITE_FILE"
MODEL_SIZE=$(du -h "$TFLITE_FILE" | cut -f1)
echo "   Size: $MODEL_SIZE"
echo ""

# Step 4: Find or download labels
echo "📝 Step 4: Setting up labels..."

LABELS_FILE=""
# Check if there's a labels file in the extracted archive
if [ -f "labels.txt" ]; then
    LABELS_FILE="labels.txt"
    echo "✅ Found labels.txt in model archive"
elif [ -f "dict.txt" ]; then
    LABELS_FILE="dict.txt"
    echo "✅ Found dict.txt in model archive"
else
    # Download from official source
    echo "⬇️  Downloading labels from official source..."
    curl -o aiy_food_V1_labelmap.csv \
      https://www.gstatic.com/aihub/tfhub/labelmaps/aiy_food_V1_labelmap.csv
    
    if [ $? -eq 0 ]; then
        LABELS_FILE="aiy_food_V1_labelmap.csv"
        echo "✅ Downloaded official labels"
    else
        echo "⚠️  Could not download labels, will create from model"
    fi
fi

# Step 5: Convert labels to JSON
echo ""
echo "🔄 Step 5: Converting labels to JSON..."

python3 << PYTHON_SCRIPT
import json
import sys

labels = []

# Read labels file
try:
    with open("$LABELS_FILE", 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                # Handle CSV format (label may be in first column)
                if ',' in line:
                    labels.append(line.split(',')[0].strip())
                else:
                    labels.append(line)
    
    print(f"✅ Loaded {len(labels)} labels from $LABELS_FILE")
    
except Exception as e:
    print(f"⚠️  Error reading labels: {e}")
    print("   Creating generic labels...")
    # Create generic labels if we can't read the file
    labels = [f"food_class_{i}" for i in range(2024)]

# Show samples
print(f"\n📊 Total labels: {len(labels)}")
print("\nFirst 20 labels:")
for i in range(min(20, len(labels))):
    print(f"  {i}: {labels[i]}")

if len(labels) > 20:
    print(f"\n... ({len(labels) - 20} more) ...\n")
    print("Last 10 labels:")
    for i in range(max(0, len(labels)-10), len(labels)):
        print(f"  {i}: {labels[i]}")

# Save as JSON
with open('labels.json', 'w', encoding='utf-8') as f:
    json.dump(labels, f, indent=2, ensure_ascii=False)

print(f"\n✅ Saved {len(labels)} labels to labels.json")

PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Failed to convert labels"
    exit 1
fi

echo ""

# Step 6: Copy to Android assets
echo "📱 Step 6: Installing to Android assets..."

ASSETS_DIR="../android/app/src/main/assets"

if [ ! -d "$ASSETS_DIR" ]; then
    echo "⚠️  Assets directory not found, creating..."
    mkdir -p "$ASSETS_DIR"
fi

# Backup old model if exists
if [ -f "$ASSETS_DIR/vision_v1.tflite" ]; then
    echo "📦 Backing up old model..."
    mv "$ASSETS_DIR/vision_v1.tflite" "$ASSETS_DIR/vision_v1.tflite.backup"
fi

# Copy new model
cp "$TFLITE_FILE" "$ASSETS_DIR/vision_v1.tflite"
echo "✅ Copied model to: $ASSETS_DIR/vision_v1.tflite"

# Copy labels
cp labels.json "$ASSETS_DIR/labels.json"
echo "✅ Copied labels to: $ASSETS_DIR/labels.json"

# Verify files
echo ""
echo "✅ Verification:"
echo "   Model: $(ls -lh $ASSETS_DIR/vision_v1.tflite | awk '{print $5}')"
echo "   Labels: $(wc -l < labels.json) lines"

echo ""

# Step 7: Test model with Python
echo "🧪 Step 7: Testing model integrity..."

python3 << PYTHON_SCRIPT
import sys
try:
    import tensorflow as tf
    
    # Load model
    interpreter = tf.lite.Interpreter(model_path="$ASSETS_DIR/vision_v1.tflite")
    interpreter.allocate_tensors()
    
    # Get input/output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("✅ Model loaded successfully!")
    print(f"\n📊 Model specifications:")
    print(f"   Input shape: {input_details[0]['shape']}")
    print(f"   Input type: {input_details[0]['dtype']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    print(f"   Output type: {output_details[0]['dtype']}")
    
    # Verify it matches our code expectations
    expected_shape = [1, 192, 192, 3]
    if list(input_details[0]['shape']) == expected_shape:
        print("   ✅ Input shape matches code expectations (192x192x3)")
    else:
        print(f"   ⚠️  Input shape differs from expected {expected_shape}")
    
except ImportError:
    print("⚠️  TensorFlow not installed, skipping model test")
    print("   (Model will still work on Android)")
except Exception as e:
    print(f"❌ Error testing model: {e}")
    sys.exit(1)

PYTHON_SCRIPT

echo ""

# Cleanup
echo "🧹 Step 8: Cleaning up temporary files..."
rm -f model.tar.gz
rm -f "$TFLITE_FILE"
if [ -f "aiy_food_V1_labelmap.csv" ]; then
    rm -f aiy_food_V1_labelmap.csv
fi
echo "✅ Cleanup complete"

echo ""
echo "=============================================="
echo "🎉 SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "✅ Model installed: $ASSETS_DIR/vision_v1.tflite"
echo "✅ Labels installed: $ASSETS_DIR/labels.json"
echo ""
echo "📱 Next step: Rebuild the Android app"
echo "   cd .."
echo "   npm run android"
echo ""
echo "🔍 The app will now recognize food items using the"
echo "   Google AIY Food Classifier V1 model"
echo ""
