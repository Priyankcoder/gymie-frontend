
#!/usr/bin/env python3
"""
Download and verify a working Food101 TensorFlow Lite model
"""

import os
import sys
import urllib.request
import hashlib

def download_file(url, filename):
    """Download file with progress"""
    print(f"📥 Downloading {filename}...")
    print(f"   URL: {url}")
    
    def reporthook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        sys.stdout.write(f"\r   Progress: {percent}%")
        sys.stdout.flush()
    
    try:
        urllib.request.urlretrieve(url, filename, reporthook)
        print("\n✅ Download complete!")
        return True
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        return False

def verify_model_size(filename, expected_min_mb=20):
    """Verify model file size"""
    size_mb = os.path.getsize(filename) / (1024 * 1024)
    print(f"\n📦 Model file size: {size_mb:.2f} MB")
    
    if size_mb < expected_min_mb:
        print(f"⚠️  WARNING: File seems too small (expected >{expected_min_mb}MB)")
        return False
    
    print("✅ Size looks good")
    return True

def test_model(model_path):
    """Quick test of the model"""
    print(f"\n🧪 Testing model...")
    
    try:
        import tensorflow as tf
        import numpy as np
        
        # Load model
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        
        # Get input/output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        input_shape = input_details[0]['shape']
        output_shape = output_details[0]['shape']
        
        print(f"✅ Model loaded successfully!")
        print(f"   Input shape: {input_shape}")
        print(f"   Output shape: {output_details}")
        print(f"   Number of classes: {output_shape[1]}")
        
        # Run a dummy inference
        print(f"\n🔬 Running test inference...")
        dummy_input = np.random.rand(*input_shape).astype(np.float32)
        interpreter.set_tensor(input_details[0]['index'], dummy_input)
        interpreter.invoke()
        output = interpreter.get_tensor(output_details[0]['index'])
        
        # Check output distribution
        max_prob = output.max()
        min_prob = output.min()
        mean_prob = output.mean()
        
        print(f"✅ Inference successful!")
        print(f"   Output range: [{min_prob:.6f}, {max_prob:.6f}]")
        print(f"   Mean probability: {mean_prob:.6f}")
        
        # Sanity check
        if max_prob > 0.9 or max_prob < 0.001:
            print(f"⚠️  WARNING: Unusual probability distribution")
            print(f"   This might indicate an issue with the model")
        else:
            print(f"✅ Output distribution looks reasonable")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def main():
    print("\n" + "="*70)
    print("🍕 Download Working Food101 TensorFlow Lite Model")
    print("="*70 + "\n")
    
    # Backup old model
    old_model = "vision_v1.tflite"
    if os.path.exists(old_model):
        backup = f"{old_model}.backup"
        print(f"📁 Backing up old model to: {backup}")
        os.rename(old_model, backup)
    
    # Option 1: TensorFlow Hub Food101 model
    print("\n🎯 Downloading verified Food101 model from TensorFlow Hub...")
    
    # This is a known working Food101 model
    models = [
        {
            "name": "TF Hub Food101 V1",
            "url": "https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1?lite-format=tflite",
            "filename": "vision_v1_tfhub.tflite",
            "description": "Official Food101 model from TensorFlow Hub"
        },
        {
            "name": "Alternative Food Classifier",
            "url": "https://storage.googleapis.com/download.tensorflow.org/models/tflite/task_library/image_classification/android/lite-model_aiy_vision_classifier_food_V1_1.tflite",
            "filename": "vision_v1_alternative.tflite",
            "description": "Alternative TensorFlow model repository"
        }
    ]
    
    success = False
    working_model = None
    
    for i, model in enumerate(models, 1):
        print(f"\n{'='*70}")
        print(f"Option {i}: {model['name']}")
        print(f"Description: {model['description']}")
        print(f"{'='*70}")
        
        if download_file(model['url'], model['filename']):
            if verify_model_size(model['filename']):
                if test_model(model['filename']):
                    success = True
                    working_model = model['filename']
                    print(f"\n✅ SUCCESS! Model '{model['name']}' is working!")
                    break
        
        print(f"\n⚠️  Option {i} didn't work, trying next...")
    
    if success and working_model:
        # Replace the old model
        final_name = "vision_v1.tflite"
        print(f"\n{'='*70}")
        print(f"📝 Replacing model file...")
        print(f"   Old: {old_model} → {old_model}.backup")
        print(f"   New: {working_model} → {final_name}")
        print(f"{'='*70}")
        
        if os.path.exists(final_name):
            os.remove(final_name)
        os.rename(working_model, final_name)
        
        print(f"\n✅ Model replacement complete!")
        print(f"\n📋 Next steps:")
        print(f"   1. Run: python test_model_complete.py")
        print(f"   2. Verify predictions are now working")
        print(f"   3. Copy to Android: cp vision_v1.tflite ../android/app/src/main/assets/")
        print(f"   4. Rebuild Android app: npm run android")
        
    else:
        print(f"\n❌ Failed to download a working model")
        print(f"\n🔧 Manual alternatives:")
        print(f"   1. Download from: https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1")
        print(f"   2. Or search 'Food101 TFLite model' on GitHub")
        print(f"   3. Place as: vision_v1.tflite")
        
        # Restore backup if available
        if os.path.exists(f"{old_model}.backup"):
            print(f"\n📁 Restoring backup...")
            os.rename(f"{old_model}.backup", old_model)

if __name__ == "__main__":
    # Check for tensorflow
    try:
        import tensorflow
    except ImportError:
        print("📦 Installing TensorFlow...")
        os.system("pip install tensorflow")
    
    main()
