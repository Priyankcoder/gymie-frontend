
#!/bin/bash

echo "=================================="
echo "📥 Downloading Google AIY Food V1 Labels"
echo "=================================="
echo ""

# URL for the official label map
LABEL_MAP_URL="https://www.gstatic.com/aihub/tfhub/labelmaps/aiy_food_V1_labelmap.csv"

echo "🔗 Source: $LABEL_MAP_URL"
echo ""

# Download the CSV
echo "⬇️  Downloading labels CSV..."
curl -o aiy_food_V1_labelmap.csv "$LABEL_MAP_URL"

if [ $? -ne 0 ]; then
    echo "❌ Failed to download labels"
    exit 1
fi

echo "✅ Download complete!"
echo ""

# Convert CSV to JSON
echo "🔄 Converting CSV to JSON..."
python3 << 'PYTHON_SCRIPT'
import csv
import json

# Read CSV (no header, just labels)
labels = []
with open('aiy_food_V1_labelmap.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if row:  # Skip empty rows
            labels.append(row[0].strip())

print(f"✅ Loaded {len(labels)} food labels")

# Show sample
print("\nFirst 20 labels:")
for i, label in enumerate(labels[:20]):
    print(f"  {i}: {label}")

print("\nLast 10 labels:")
for i in range(max(0, len(labels)-10), len(labels)):
    print(f"  {i}: {labels[i]}")

# Save as JSON
with open('labels.json', 'w') as f:
    json.dump(labels, f, indent=2)

print(f"\n✅ Saved {len(labels)} labels to labels.json")

PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Failed to convert to JSON"
    exit 1
fi

# Copy to Android assets
ASSETS_DIR="../android/app/src/main/assets"
if [ -d "$ASSETS_DIR" ]; then
    echo ""
    echo "📱 Copying to Android assets..."
    cp labels.json "$ASSETS_DIR/labels.json"
    echo "✅ Copied to: $ASSETS_DIR/labels.json"
fi

# Cleanup CSV
rm aiy_food_V1_labelmap.csv

echo ""
echo "=================================="
echo "✅ LABELS SUCCESSFULLY INSTALLED!"
echo "=================================="
echo ""
echo "📱 Next step: Rebuild the Android app"
echo "   cd .."
echo "   npm run android"
echo ""
