
#!/usr/bin/env python3
"""
Fix labels by properly parsing the CSV with id,name columns
"""
import csv
import json

print("🔧 Fixing labels from CSV...")

# Read the CSV with proper column parsing
labels = []
with open('aiy_food_V1_labelmap.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)  # Use DictReader to parse header
    for row in reader:
        name = row['name'].strip()
        labels.append(name)

print(f"✅ Loaded {len(labels)} food labels")

# Show samples
print("\n📊 Label samples:")
print("\nFirst 25 labels:")
for i in range(min(25, len(labels))):
    print(f"  {i}: {labels[i]}")

if len(labels) > 35:
    print(f"\n... ({len(labels) - 35} more labels) ...\n")
    print("Last 10 labels:")
    for i in range(len(labels) - 10, len(labels)):
        print(f"  {i}: {labels[i]}")

# Save as JSON
with open('labels.json', 'w', encoding='utf-8') as f:
    json.dump(labels, f, indent=2, ensure_ascii=False)

print(f"\n✅ Saved {len(labels)} labels to labels.json")

# Copy to Android assets
import shutil
from pathlib import Path

assets_path = Path(__file__).parent.parent / 'android' / 'app' / 'src' / 'main' / 'assets' / 'labels.json'
if assets_path.parent.exists():
    shutil.copy('labels.json', assets_path)
    print(f"✅ Copied to Android assets: {assets_path}")

print("\n" + "="*70)
print("✅ LABELS FIXED!")
print("="*70)
print("\nNow rebuild the app:")
print("  cd ..")
print("  npm run android")
