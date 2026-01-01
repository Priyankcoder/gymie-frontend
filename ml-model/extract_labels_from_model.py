
#!/usr/bin/env python3
"""
Extract labels from TensorFlow Lite model metadata
"""
import json
import sys
from pathlib import Path

def extract_labels_from_tflite(model_path):
    """Extract labels from TFLite model metadata"""
    try:
        import tensorflow as tf
        print(f"✅ TensorFlow version: {tf.__version__}")
    except ImportError:
        print("❌ TensorFlow not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflow"])
        import tensorflow as tf
    
    print(f"\n📂 Reading model: {model_path}")
    
    # Read the model file
    with open(model_path, 'rb') as f:
        model_content = f.read()
    
    print(f"📏 Model size: {len(model_content) / 1024 / 1024:.2f} MB")
    
    # Try to load interpreter
    try:
        interpreter = tf.lite.Interpreter(model_path=str(model_path))
        interpreter.allocate_tensors()
        
        # Get output details
        output_details = interpreter.get_output_details()
        print(f"\n🔍 Output tensor details:")
        for detail in output_details:
            print(f"  Name: {detail['name']}")
            print(f"  Shape: {detail['shape']}")
            print(f"  Type: {detail['dtype']}")
        
    except Exception as e:
        print(f"⚠️  Could not load interpreter: {e}")
    
    # Try to extract metadata
    print("\n🔍 Searching for embedded labels in model metadata...")
    
    # TFLite models may have metadata in various formats
    # Let's search for common patterns
    model_str = model_content.decode('utf-8', errors='ignore')
    
    # Search for label patterns
    labels = []
    
    # Pattern 1: Labels separated by newlines
    if 'background\n' in model_str or 'person\n' in model_str:
        print("✅ Found newline-separated labels")
        # Extract section with labels
        parts = model_str.split('\n')
        in_labels = False
        for part in parts:
            part = part.strip()
            if part and len(part) < 50 and part[0].isalpha():  # Likely a label
                if not in_labels:
                    in_labels = True
                    print("📝 Extracting labels...")
                labels.append(part)
            elif in_labels and len(labels) > 100:
                break
    
    # Pattern 2: Try to find metadata buffer
    try:
        # TFLite metadata is stored in specific buffers
        # This is a heuristic search
        import struct
        
        # Search for potential label data
        search_start = model_str.find('labels')
        if search_start > 0:
            print(f"✅ Found 'labels' string at position {search_start}")
            # Extract nearby text that looks like labels
            context = model_str[search_start:search_start+50000]
            potential_labels = []
            for word in context.split('\x00'):
                word = word.strip()
                if word and 3 < len(word) < 50 and word[0].isalpha():
                    potential_labels.append(word)
            
            if len(potential_labels) > 100:
                print(f"✅ Found {len(potential_labels)} potential labels")
                labels = potential_labels[:2024]  # Take first 2024
    except Exception as e:
        print(f"⚠️  Error in metadata search: {e}")
    
    # If we found labels, save them
    if len(labels) > 100:
        print(f"\n✅ Successfully extracted {len(labels)} labels!")
        
        # Clean labels
        cleaned_labels = []
        for label in labels:
            # Remove non-printable characters
            label = ''.join(c for c in label if c.isprintable())
            label = label.strip()
            if label and len(label) > 1:
                cleaned_labels.append(label)
        
        labels = cleaned_labels
        
        print(f"📊 After cleaning: {len(labels)} labels")
        print("\nFirst 20 labels:")
        for i, label in enumerate(labels[:20], 0):
            print(f"  {i}: {label}")
        
        print("\nLast 10 labels:")
        for i, label in enumerate(labels[-10:], len(labels)-10):
            print(f"  {i}: {label}")
        
        # Save to JSON
        output_path = Path(__file__).parent / 'labels.json'
        with open(output_path, 'w') as f:
            json.dump(labels, f, indent=2)
        
        print(f"\n✅ Saved to: {output_path}")
        
        # Copy to Android assets
        assets_path = Path(__file__).parent.parent / 'android' / 'app' / 'src' / 'main' / 'assets' / 'labels.json'
        if assets_path.parent.exists():
            with open(assets_path, 'w') as f:
                json.dump(labels, f, indent=2)
            print(f"✅ Copied to Android assets: {assets_path}")
        
        return labels
    else:
        print(f"\n❌ Could not extract labels from model metadata")
        print(f"   Only found {len(labels)} potential labels")
        print("\n💡 The model might not have embedded labels.")
        print("   You may need to:")
        print("   1. Find the original labels file from the model source")
        print("   2. Use a generic list of 2024 food categories")
        print("   3. Create a mapping based on the model's training dataset")
        return None

if __name__ == '__main__':
    model_path = Path(__file__).parent.parent / 'android' / 'app' / 'src' / 'main' / 'assets' / 'vision_v1.tflite'
    
    if not model_path.exists():
        print(f"❌ Model not found at: {model_path}")
        sys.exit(1)
    
    labels = extract_labels_from_tflite(model_path)
    
    if labels:
        print("\n" + "="*70)
        print("✅ SUCCESS! Labels extracted and saved")
        print("="*70)
        print("\nNext steps:")
        print("  cd ..")
        print("  npm run android")
    else:
        print("\n" + "="*70)
        print("⚠️  Could not extract labels automatically")
        print("="*70)
        sys.exit(1)
