
#!/usr/bin/env python3
"""
TensorFlow Lite Model Testing Script
Tests the vision_v1.tflite model on sample images to verify accuracy
"""

import numpy as np
import json
import sys
from PIL import Image
import os

# Try to import TFLite
try:
    import tensorflow as tf
except ImportError:
    print("❌ TensorFlow not installed. Installing...")
    os.system("pip install tensorflow pillow")
    import tensorflow as tf

class ModelTester:
    def __init__(self, model_path="vision_v1.tflite", labels_path="labels.json"):
        """Initialize the model tester"""
        print("🔧 Loading model...")
        
        # Load TFLite model
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        
        # Get input/output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
        # Get input shape
        self.input_shape = self.input_details[0]['shape']
        self.input_size = self.input_shape[1]  # Should be 224
        
        print(f"✅ Model loaded successfully")
        print(f"   Input shape: {self.input_shape}")
        print(f"   Input size: {self.input_size}x{self.input_size}")
        print(f"   Input dtype: {self.input_details[0]['dtype']}")
        
        # Load labels
        with open(labels_path, 'r') as f:
            self.labels = json.load(f)
        
        print(f"✅ Loaded {len(self.labels)} labels\n")
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        # Load image
        img = Image.open(image_path).convert('RGB')
        print(f"📸 Original image size: {img.size}")
        
        # Resize to model input size
        img = img.resize((self.input_size, self.input_size))
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Normalize to [-1, 1] (MobileNet preprocessing)
        img_array = (img_array / 127.5) - 1.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        print(f"   Preprocessed shape: {img_array.shape}")
        print(f"   Value range: [{img_array.min():.2f}, {img_array.max():.2f}]")
        
        return img_array
    
    def predict(self, image_path, top_k=5):
        """Run prediction on an image"""
        print(f"\n{'='*60}")
        print(f"🔍 Testing: {image_path}")
        print(f"{'='*60}")
        
        if not os.path.exists(image_path):
            print(f"❌ Image not found: {image_path}")
            return None
        
        # Preprocess image
        input_data = self.preprocess_image(image_path)
        
        # Set input tensor
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        
        # Run inference
        print("\n⏳ Running inference...")
        self.interpreter.invoke()
        
        # Get output tensor
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
        predictions = output_data[0]
        
        print(f"✅ Inference complete")
        print(f"   Output shape: {predictions.shape}")
        print(f"   Output range: [{predictions.min():.6f}, {predictions.max():.6f}]")
        
        # Get top K predictions
        top_indices = np.argsort(predictions)[::-1][:top_k]
        
        print(f"\n🎯 Top {top_k} Predictions:")
        print(f"{'='*60}")
        results = []
        for i, idx in enumerate(top_indices, 1):
            label = self.labels[idx] if idx < len(self.labels) else f"Unknown_{idx}"
            confidence = predictions[idx]
            results.append((label, confidence))
            
            # Color code based on confidence
            if confidence > 0.7:
                emoji = "🟢"
            elif confidence > 0.3:
                emoji = "🟡"
            else:
                emoji = "🔴"
            
            print(f"{emoji} #{i}: {label:30s} {confidence*100:6.2f}%")
        
        return results
    
    def test_suite(self, test_images):
        """Run test suite on multiple images"""
        print(f"\n{'#'*60}")
        print(f"# MODEL TEST SUITE")
        print(f"{'#'*60}\n")
        
        results = {}
        for image_path, expected_label in test_images:
            predictions = self.predict(image_path)
            if predictions:
                top_label, top_conf = predictions[0]
                is_correct = expected_label.lower() in top_label.lower()
                results[image_path] = {
                    'predicted': top_label,
                    'confidence': top_conf,
                    'expected': expected_label,
                    'correct': is_correct
                }
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*60}")
        
        total = len(results)
        correct = sum(1 for r in results.values() if r['correct'])
        high_conf = sum(1 for r in results.values() if r['confidence'] > 0.7)
        
        print(f"Total tests: {total}")
        print(f"Correct predictions: {correct} ({correct/total*100:.1f}%)")
        print(f"High confidence (>70%): {high_conf} ({high_conf/total*100:.1f}%)")
        
        print(f"\n{'='*60}")
        print(f"DETAILED RESULTS:")
        print(f"{'='*60}")
        for path, result in results.items():
            status = "✅" if result['correct'] else "❌"
            conf_emoji = "🟢" if result['confidence'] > 0.7 else "🟡" if result['confidence'] > 0.3 else "🔴"
            print(f"{status} {os.path.basename(path):20s}")
            print(f"   Expected:  {result['expected']}")
            print(f"   Predicted: {result['predicted']} {conf_emoji} ({result['confidence']*100:.1f}%)")
            print()

def main():
    """Main function"""
    print("\n" + "="*60)
    print("🍕 TensorFlow Lite Model Tester")
    print("="*60 + "\n")
    
    # Initialize tester
    try:
        tester = ModelTester()
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        sys.exit(1)
    
    # Test single image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        tester.predict(image_path, top_k=10)
        return
    
    # Run test suite on sample images
    print("\n💡 No image provided. Running test suite...")
    print("   Usage: python test_model.py <image_path>")
    print("   Or place test images in test_images/ folder\n")
    
    # Look for test images
    test_dir = "test_images"
    if not os.path.exists(test_dir):
        print(f"📁 Creating {test_dir}/ directory...")
        os.makedirs(test_dir)
        print(f"   Add test images to {test_dir}/ and run again")
        return
    
    # Find test images
    test_images = []
    for file in os.listdir(test_dir):
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Try to infer expected label from filename
            label = file.split('.')[0].replace('_', ' ')
            test_images.append((os.path.join(test_dir, file), label))
    
    if not test_images:
        print(f"❌ No test images found in {test_dir}/")
        print(f"   Add some food images and try again")
        return
    
    # Run tests
    tester.test_suite(test_images)

if __name__ == "__main__":
    main()
