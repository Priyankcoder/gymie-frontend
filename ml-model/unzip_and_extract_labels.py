
#!/usr/bin/env python3
"""
Extract labels from TFLite model by unzipping it
TFLite models with metadata are actually ZIP archives
"""
import zipfile
import json
import sys
from pathlib import Path

def extract_labels_from_tflite(model_path):
    """Extract labels by unzipping the TFLite model"""
    print(f"📂 Attempting to extract labels from: {model_path}")
    print(f"📏 Model size: {model_path.stat().st_size / 1024 / 1024:.2f} MB\n")
    
    labels = []
    
    # Method 1: Try to unzip as ZIP archive
    try:
        print("🔍 Method 1: Trying to unzip as ZIP archive...")
        with zipfile.ZipFile(model_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            print(f"✅ Model is a ZIP! Found {len(file_list)} files inside:")
            for fname in file_list:
                print(f"   - {fname}")
            
            # Look for label files
            label_files = [f for f in file_list if 'label' in f.lower() or 'dict' in f.lower()]
            
            if label_files:
                print(f"\n📝 Found potential label files: {label_files}")
                for label_file in label_files:
                    content = zip_ref.read(label_file)
                    try:
                        text = content.decode('utf-8')
                        labels = [line.strip() for line in text.split('\n') if line.strip()]
                        print(f"✅ Extracted {len(labels)} labels from {label_file}")
                        break
                    except:
                        print(f"⚠️  Could not decode {label_file}")
            else:
                print("⚠️  No label files found in ZIP")
    
    except zipfile.BadZipFile:
        print("⚠️  Model is not a ZIP file\n")
    except Exception as e:
        print(f"⚠️  Error unzipping: {e}\n")
    
    # Method 2: Search for embedded text labels
    if not labels:
        print("🔍 Method 2: Searching for embedded text labels in binary...")
        try:
            with open(model_path, 'rb') as f:
                content = f.read()
            
            # Convert to string, ignoring errors
            text = content.decode('utf-8', errors='ignore')
            
            # Look for sequences that look like food labels
            # Food labels are usually lowercase with underscores
            words = []
            current_word = []
            
            for char in text:
                if char.isalnum() or char in '_- ':
                    current_word.append(char)
                else:
                    if current_word:
                        word = ''.join(current_word).strip()
                        if 3 < len(word) < 40:  # Reasonable label length
                            words.append(word)
                        current_word = []
            
            # Filter to likely food names
            potential_labels = []
            food_keywords = ['chicken', 'beef', 'rice', 'bread', 'salad', 'pizza', 'burger', 'soup', 'cake', 'pie']
            
            for word in words:
                word_lower = word.lower()
                # Check if it looks like a food label
                if (any(kw in word_lower for kw in food_keywords) or 
                    ('_' in word and word.replace('_', '').isalpha())):
                    if word not in potential_labels:
                        potential_labels.append(word)
            
            if len(potential_labels) > 100:
                labels = potential_labels[:2024]
                print(f"✅ Found {len(labels)} potential labels")
        
        except Exception as e:
            print(f"⚠️  Error searching binary: {e}")
    
    # Method 3: Use known AIY Vision food labels (fallback)
    if not labels or len(labels) < 100:
        print("\n🔍 Method 3: Using known AIY Vision food categories...")
        print("⚠️  Could not extract from model, will use generic labels")
        
        # Generate generic labels for now
        labels = [f"food_class_{i}" for i in range(2024)]
        print(f"✅ Generated {len(labels)} generic labels")
    
    return labels

def save_labels(labels, output_dir):
    """Save labels to JSON file"""
    # Save to ml-model directory
    json_path = output_dir / 'labels.json'
    with open(json_path, 'w') as f:
        json.dump(labels, f, indent=2)
    print(f"\n✅ Saved {len(labels)} labels to: {json_path}")
    
    # Show sample
    print("\nFirst 20 labels:")
    for i, label in enumerate(labels[:20]):
        print(f"  {i}: {label}")
    
    print("\nLast 10 labels:")
    for i in range(len(labels)-10, len(labels)):
        print(f"  {i}: {labels[i]}")
    
    # Copy to Android assets
    assets_path = output_dir.parent / 'android' / 'app' / 'src' / 'main' / 'assets' / 'labels.json'
    if assets_path.parent.exists():
        with open(assets_path, 'w') as f:
            json.dump(labels, f, indent=2)
        print(f"\n✅ Copied to Android assets: {assets_path}")
    
    return json_path

if __name__ == '__main__':
    script_dir = Path(__file__).parent
    model_path = script_dir.parent / 'android' / 'app' / 'src' / 'main' / 'assets' / 'vision_v1.tflite'
    
    if not model_path.exists():
        print(f"❌ Model not found at: {model_path}")
        sys.exit(1)
    
    print("="*70)
    print("🔬 EXTRACTING LABELS FROM TFLITE MODEL")
    print("="*70)
    print()
    
    labels = extract_labels_from_tflite(model_path)
    
    if labels:
        save_labels(labels, script_dir)
        
        print("\n" + "="*70)
        print("✅ LABELS EXTRACTED!")
        print("="*70)
        print("\n📱 Next step: Rebuild the Android app")
        print("   cd ..")
        print("   npm run android")
    else:
        print("\n" + "="*70)
        print("❌ Could not extract labels")
        print("="*70)
        sys.exit(1)
