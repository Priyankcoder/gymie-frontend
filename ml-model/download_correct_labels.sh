
#!/bin/bash

echo "📥 Downloading correct labels file for the model..."

# The GitHub repo has the labels file
LABELS_URL="https://raw.githubusercontent.com/SilviaSantano/Recognize-Food-With-TensorFlow-Lite/main/app/src/main/assets/labels.txt"

# Backup old labels
if [ -f "labels.json" ]; then
    echo "📦 Backing up old labels..."
    cp labels.json labels.json.backup
fi

# Download new labels
echo "⬇️  Downloading from: $LABELS_URL"
curl -o labels_downloaded.txt "$LABELS_URL"

# Convert txt to json
echo "🔄 Converting to JSON format..."
python3 << 'PYTHON_SCRIPT'
import json

# Read labels from downloaded file
with open('labels_downloaded.txt', 'r') as f:
    labels = [line.strip() for line in f if line.strip()]

print(f"Found {len(labels)} labels")

# Save as JSON
with open('labels.json', 'w') as f:
    json.dump(labels, f, indent=2)

print(f"✅ Saved {len(labels)} labels to labels.json")

# Show first 10
print("\nFirst 10 labels:")
for i, label in enumerate(labels[:10], 1):
    print(f"  {i}. {label}")

PYTHON_SCRIPT

# Copy to Android assets
if [ -d "../android/app/src/main/assets" ]; then
    echo "📱 Copying to Android assets..."
    cp labels.json ../android/app/src/main/assets/labels.json
    echo "✅ Done!"
fi

# Cleanup
rm labels_downloaded.txt

echo ""
echo "="*70
echo "✅ LABELS FILE UPDATED!"
echo "="*70
echo ""
echo "Now rebuild the app:"
echo "  cd .."
echo "  npm run android"
