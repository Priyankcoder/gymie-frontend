
#!/usr/bin/env python3
"""
Test the lite-model_aiy_vision_classifier_food_V1_1.tflite model
from Downloads folder
"""

import os
import sys
import shutil

try:
    import tensorflow as tf
    import numpy as np
    from PIL import Image
except ImportError:
    print("Installing dependencies...")
    os.system("pip install tensorflow pillow")
    import tensorflow as tf
    import numpy as np
    from PIL import Image

def find_model_in_downloads():
    """Find the model in common Downloads locations"""
    home = os.path.expanduser("~")
    possible_paths = [
        os.path.join(home, "Downloads", "lite-model_aiy_vision_classifier_food_V1_1.tflite"),
        os.path.join(home, "downloads", "lite-model_aiy_vision_classifier_food_V1_1.tflite"),
        "./lite-model_aiy_vision_classifier_food_V1_1.tflite",
        "../lite-model_aiy_vision_classifier_food_V1_1.tflite",
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

def test_model(model_path):
    """Test the model thoroughly"""
    print("\n" + "="*70)
    print("🧪 TESTING MODEL FROM DOWNLOADS")
    print("="*70)
    print(f"\nModel: {model_path}")
    
    # Check file size
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Size: {size_mb:.2f} MB")
    
    # Load model
    print("\n📦 Loading model...")
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    # Get details
    input_details = interpreter.get_input_details()[0]
    output_details = interpreter.get_output_details()[0]
    
    print(f"✅ Model loaded successfully!")
    print(f"\n📋 Model Specifications:")
    print(f"   Input shape: {input_details['shape']}")
    print(f"   Input dtype: {input_details['dtype']}")
    print(f"   Output shape: {output_details['shape']}")
    print(f"   Output dtype: {output_details['dtype']}")
    
    # Check if quantized
    is_quantized = input_details['dtype'] == np.uint8
    print(f"   Quantized: {'YES (UINT8)' if is_quantized else 'NO (FLOAT32)'}")
    
    input_shape = input_details['shape']
    input_size = input_shape[1]
    num_classes = output_details['shape'][1]
    
    print(f"   Input size: {input_size}x{input_size}")
    print(f"   Number of classes: {num_classes}")
    
    # Test with dummy data
    print(f"\n🔬 Running test inference...")
    if is_quantized:
        dummy_input = np.random.randint(0, 256, input_shape, dtype=np.uint8)
    else:
        dummy_input = np.random.rand(*input_shape).astype(np.float32)
    
    interpreter.set_tensor(input_details['index'], dummy_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details['index'])
    
    print(f"✅ Inference successful!")
    print(f"   Output range: [{output.min():.6f}, {output.max():.6f}]")
    print(f"   Output mean: {output.mean():.6f}")
    
    # Check if output needs dequantization
    if output_details['dtype'] == np.uint8:
        scale, zero_point = output_details['quantization']
        print(f"   Quantization scale: {scale}")
        print(f"   Quantization zero_point: {zero_point}")
    
    return is_quantized, input_size, num_classes

def copy_model():
    """Copy model to project"""
    model_path = find_model_in_downloads()
    
    if not model_path:
        print("\n❌ Model not found in Downloads folder!")
        print("   Expected: ~/Downloads/lite-model_aiy_vision_classifier_food_V1_1.tflite")
        print("\n   Please provide the full path:")
        model_path = input("   Path: ").strip()
        
        if not os.path.exists(model_path):
            print(f"❌ File not found: {model_path}")
            sys.exit(1)
    
    print(f"\n✅ Found model: {model_path}")
    
    # Test it
    is_quantized, input_size, num_classes = test_model(model_path)
    
    # Copy to project
    dest_path = "vision_v1.tflite"
    backup_path = "vision_v1.tflite.old"
    
    print(f"\n📁 Copying to project...")
    
    # Backup old model
    if os.path.exists(dest_path):
        shutil.copy(dest_path, backup_path)
        print(f"   Backed up old model to: {backup_path}")
    
    # Copy new model
    shutil.copy(model_path, dest_path)
    print(f"✅ Copied to: {dest_path}")
    
    # Also copy to Android assets
    android_path = "../android/app/src/main/assets/vision_v1.tflite"
    if os.path.exists(os.path.dirname(android_path)):
        shutil.copy(model_path, android_path)
        print(f"✅ Copied to: {android_path}")
    
    print(f"\n{'='*70}")
    print(f"🎯 MODEL INTEGRATION SUMMARY")
    print(f"{'='*70}")
    print(f"\n✅ Model Type: {'QUANTIZED (UINT8)' if is_quantized else 'FLOAT32'}")
    print(f"✅ Input Size: {input_size}x{input_size}")
    print(f"✅ Classes: {num_classes}")
    
    if is_quantized:
        print(f"\n⚠️  IMPORTANT: Model is QUANTIZED")
        print(f"   Android code needs to be updated for UINT8 input")
        print(f"   See: UPDATE_ANDROID_FOR_QUANTIZED.md")
    else:
        print(f"\n✅ Model is FLOAT32 - current Android code should work!")
    
    if input_size != 224:
        print(f"\n⚠️  IMPORTANT: Input size is {input_size}, not 224")
        print(f"   Update INPUT_SIZE in NutritionClassifierModule.kt to {input_size}")
    
    if num_classes != 101:
        print(f"\n⚠️  IMPORTANT: Model has {num_classes} classes, not 101")
        print(f"   Update NUM_CLASSES in NutritionClassifierModule.kt to {num_classes}")
        print(f"   You may need a different labels.json file")
    
    print(f"\n{'='*70}")
    print(f"📝 NEXT STEPS")
    print(f"{'='*70}")
    print(f"\n1. Update Android code if needed (see warnings above)")
    print(f"2. Test with Python: python test_model_complete.py")
    print(f"3. If Python works (>70% confidence):")
    print(f"   - Rebuild Android: cd .. && npm run android")
    print(f"   - Test food recognition in app")
    print(f"\n4. If Python fails (<10% confidence):")
    print(f"   - Model is still wrong")
    print(f"   - Try a different model file")

if __name__ == "__main__":
    copy_model()
