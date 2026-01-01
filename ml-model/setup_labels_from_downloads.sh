
#!/bin/bash

echo "=============================================="
echo "📝 Setting Up Google AIY Food Labels"
echo "=============================================="
echo ""

# Source file from Downloads
DOWNLOADS_FILE="$HOME/Downloads/aiy_food_V1_labelmap.csv"

echo "📂 Looking for labels in Downloads folder..."
echo "   Path: $DOWNLOADS_FILE"
echo ""

if [ ! -f "$DOWNLOADS_FILE" ]; then
    echo "❌ Labels file not found at: $DOWNLOADS_FILE"
    echo ""
    echo "💡 Please make sure the file exists:"
    echo "   ls -la ~/Downloads/aiy_food_V1_labelmap.csv"
    exit 1
fi

echo "✅ Found labels file!"
FILE_SIZE=$(du -h "$DOWNLOADS_FILE" | cut -f1)
echo "   Size: $FILE_SIZE"
echo ""

# Copy to ml-model directory
echo "📋 Copying labels file..."
cp "$DOWNLOADS_FILE" aiy_food_V1_labelmap.csv

# Convert CSV to JSON
echo "🔄 Converting CSV to JSON format..."

python3 << 'PYTHON_SCRIPT'
import csv
import json

# Read CSV file
labels = []
with open('aiy_food_V1_labelmap.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for row in reader:
        if row:  # Skip empty rows
            # Take first column if CSV, otherwise the whole line
            label = row[0].strip() if row else ""
            if label:
                labels.append(label)

print(f"✅ Loaded {len(labels)} food labels from CSV")

# Show samples
print("\n📊 Label samples:")
print("\nFirst 20 labels:")
for i in range(min(20, len(labels))):
    print(f"  {i}: {labels[i]}")

if len(labels) > 30:
    print(f"\n... ({len(labels) - 30} more labels) ...\n")
    print("Last 10 labels:")
    for i in range(len(labels) - 10, len(labels)):
        print(f"  {i}: {labels[i]}")

# Save as JSON
with open('labels.json', 'w', encoding='utf-8') as f:
    json.dump(labels, f, indent=2, ensure_ascii=False)

print(f"\n✅ Saved {len(labels)} labels to labels.json")

# Create a summary
with open('labels_summary.txt', 'w', encoding='utf-8') as f:
    f.write(f"Google AIY Food Classifier V1 Labels\n")
    f.write(f"====================================\n\n")
    f.write(f"Total labels: {len(labels)}\n\n")
    f.write("All labels:\n")
    for i, label in enumerate(labels):
        f.write(f"{i}: {label}\n")

print("✅ Created labels_summary.txt for reference")

PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Failed to convert labels"
    exit 1
fi

echo ""

# Copy to Android assets
echo "📱 Installing labels to Android assets..."

ASSETS_DIR="../android/app/src/main/assets"

if [ ! -d "$ASSETS_DIR" ]; then
    echo "📁 Creating assets directory..."
    mkdir -p "$ASSETS_DIR"
fi

# Backup old labels if exists
if [ -f "$ASSETS_DIR/labels.json" ]; then
    echo "📦 Backing up old labels..."
    cp "$ASSETS_DIR/labels.json" "$ASSETS_DIR/labels.json.backup"
fi

# Copy new labels
cp labels.json "$ASSETS_DIR/labels.json"
echo "✅ Copied labels to: $ASSETS_DIR/labels.json"

# Verify
echo ""
echo "✅ Verification:"
LABEL_COUNT=$(jq length labels.json 2>/dev/null || echo "unknown")
echo "   Labels file: $ASSETS_DIR/labels.json"
echo "   Label count: $LABEL_COUNT"

echo ""

# Check if model exists
if [ -f "$ASSETS_DIR/vision_v1.tflite" ]; then
    MODEL_SIZE=$(ls -lh "$ASSETS_DIR/vision_v1.tflite" | awk '{print $5}')
    echo "✅ Model file exists: $ASSETS_DIR/vision_v1.tflite ($MODEL_SIZE)"
else
    echo "⚠️  Model file not found: $ASSETS_DIR/vision_v1.tflite"
    echo "   Make sure you've copied the .tflite model file to the assets folder"
fi

echo ""
echo "=============================================="
echo "✅ LABELS SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "📄 Files created:"
echo "   • labels.json - JSON format for the app"
echo "   • labels_summary.txt - Human-readable list"
echo ""
echo "📱 Next steps:"
echo "   1. Make sure vision_v1.tflite is in assets/"
echo "   2. Rebuild the app: cd .. && npm run android"
echo ""
