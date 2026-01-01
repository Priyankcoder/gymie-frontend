
#!/usr/bin/env python3
"""
Complete Automated ML Model Testing Script
Downloads test food images and validates the TFLite model
"""

import numpy as np
import json
import sys
import os
import urllib.request
from datetime import datetime

# Try to import required packages
try:
    import tensorflow as tf
    from PIL import Image
except ImportError:
    print("📦 Installing required packages...")
    os.system("pip install tensorflow pillow numpy requests")
    import tensorflow as tf
    from PIL import Image

class CompleteModelTester:
    def __init__(self):
        self.model_path = "vision_v1.tflite"
        self.labels_path = "labels.json"
        self.test_images_dir = "test_images_auto"
        self.results_file = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        # Test images to download (from Wikipedia/Commons)
        self.test_images = {
            "pizza": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/640px-Eq_it-na_pizza-margherita_sep2005_sml.jpg",
            "burger": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RedDot_Burger.jpg/640px-RedDot_Burger.jpg",
            "sushi": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sushi_platter.jpg/640px-Sushi_platter.jpg",
            "ice_cream": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ice_cream_with_whipped_cream%2C_chocolate_syrup%2C_and_a_wafer_%28cropped%29.jpg/640px-Ice_cream_with_whipped_cream%2C_chocolate_syrup%2C_and_a_wafer_%28cropped%29.jpg",
            "french_fries": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Pommes-1.jpg/640px-Pommes-1.jpg",
            "hot_dog": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Hotdog_-_Evan_Swigart.jpg/640px-Hotdog_-_Evan_Swigart.jpg",
            "chicken_wings": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Chicken_wings_with_dips.jpg/640px-Chicken_wings_with_dips.jpg",
            "caesar_salad": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Caesar_salad_with_chicken.jpg/640px-Caesar_salad_with_chicken.jpg",
        }
        
        self.log_file = open(self.results_file, 'w')
        
    def log(self, message):
        """Log to both console and file"""
        print(message)
        self.log_file.write(message + '\n')
        self.log_file.flush()
    
    def download_test_images(self):
        """Download test images"""
        self.log("\n" + "="*70)
        self.log("📥 DOWNLOADING TEST IMAGES")
        self.log("="*70)
        
        if not os.path.exists(self.test_images_dir):
            os.makedirs(self.test_images_dir)
            self.log(f"✅ Created directory: {self.test_images_dir}")
        
        downloaded = []
        for name, url in self.test_images.items():
            file_path = os.path.join(self.test_images_dir, f"{name}.jpg")
            
            if os.path.exists(file_path):
                self.log(f"✓ {name}.jpg already exists")
                downloaded.append((file_path, name))
                continue
            
            try:
                self.log(f"⬇️  Downloading {name}...")
                urllib.request.urlretrieve(url, file_path)
                self.log(f"✅ Downloaded: {name}.jpg")
                downloaded.append((file_path, name))
            except Exception as e:
                self.log(f"❌ Failed to download {name}: {e}")
        
        self.log(f"\n✅ Successfully downloaded {len(downloaded)}/{len(self.test_images)} images\n")
        return downloaded
    
    def load_model(self):
        """Load TFLite model"""
        self.log("\n" + "="*70)
        self.log("🔧 LOADING MODEL")
        self.log("="*70)
        
        if not os.path.exists(self.model_path):
            self.log(f"❌ Model file not found: {self.model_path}")
            self.log(f"   Please ensure vision_v1.tflite is in the current directory")
            sys.exit(1)
        
        # Check model file size
        size_mb = os.path.getsize(self.model_path) / (1024 * 1024)
        self.log(f"📦 Model file: {self.model_path}")
        self.log(f"   Size: {size_mb:.2f} MB")
        
        try:
            # Load TFLite model
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            
            # Get input/output details
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            
            # Get input shape
            self.input_shape = self.input_details[0]['shape']
            self.input_size = self.input_shape[1]
            
            self.log(f"✅ Model loaded successfully")
            self.log(f"   Input shape: {self.input_shape}")
            self.log(f"   Input size: {self.input_size}x{self.input_size}")
            self.log(f"   Input dtype: {self.input_details[0]['dtype']}")
            self.log(f"   Output shape: {self.output_details[0]['shape']}")
            
            # Load labels
            if not os.path.exists(self.labels_path):
                self.log(f"❌ Labels file not found: {self.labels_path}")
                sys.exit(1)
            
            with open(self.labels_path, 'r') as f:
                self.labels = json.load(f)
            
            self.log(f"✅ Loaded {len(self.labels)} labels")
            self.log(f"   Sample labels: {', '.join(self.labels[:5])}")
            
        except Exception as e:
            self.log(f"❌ Error loading model: {e}")
            sys.exit(1)
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        # Load image
        img = Image.open(image_path).convert('RGB')
        original_size = img.size
        
        # Resize to model input size
        img = img.resize((self.input_size, self.input_size))
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Normalize to [-1, 1] (MobileNet preprocessing)
        img_array = (img_array / 127.5) - 1.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array, original_size
    
    def predict(self, image_path, expected_label):
        """Run prediction on an image"""
        self.log(f"\n{'='*70}")
        self.log(f"🔍 TESTING: {os.path.basename(image_path)}")
        self.log(f"   Expected: {expected_label}")
        self.log(f"{'='*70}")
        
        # Preprocess image
        input_data, original_size = self.preprocess_image(image_path)
        self.log(f"📸 Original size: {original_size}")
        self.log(f"   Preprocessed: {input_data.shape}, range: [{input_data.min():.2f}, {input_data.max():.2f}]")
        
        # Set input tensor
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        
        # Run inference
        self.interpreter.invoke()
        
        # Get output tensor
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
        predictions = output_data[0]
        
        # Get top 5 predictions
        top_indices = np.argsort(predictions)[::-1][:5]
        
        self.log(f"\n🎯 Top 5 Predictions:")
        self.log(f"{'-'*70}")
        
        results = []
        for i, idx in enumerate(top_indices, 1):
            label = self.labels[idx] if idx < len(self.labels) else f"Unknown_{idx}"
            confidence = predictions[idx]
            results.append((label, confidence))
            
            # Determine status
            if i == 1:
                is_match = expected_label.lower() in label.lower() or label.lower() in expected_label.lower()
                status = "✅" if is_match else "❌"
            else:
                status = "  "
            
            # Color code
            if confidence > 0.7:
                conf_emoji = "🟢"
            elif confidence > 0.3:
                conf_emoji = "🟡"
            else:
                conf_emoji = "🔴"
            
            self.log(f"{status} {conf_emoji} #{i}: {label:30s} {confidence*100:6.2f}%")
        
        return results
    
    def run_full_test(self):
        """Run complete test suite"""
        self.log("\n" + "#"*70)
        self.log("# 🍕 COMPLETE ML MODEL TEST SUITE")
        self.log("# " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        self.log("#"*70)
        
        # Download test images
        test_images = self.download_test_images()
        
        # Load model
        self.load_model()
        
        # Run predictions
        self.log("\n" + "="*70)
        self.log("🧪 RUNNING PREDICTIONS")
        self.log("="*70)
        
        results = {}
        for image_path, expected_label in test_images:
            predictions = self.predict(image_path, expected_label)
            if predictions:
                top_label, top_conf = predictions[0]
                is_correct = expected_label.lower() in top_label.lower() or top_label.lower() in expected_label.lower()
                results[expected_label] = {
                    'predicted': top_label,
                    'confidence': top_conf,
                    'correct': is_correct,
                    'all_predictions': predictions
                }
        
        # Print summary
        self.log(f"\n{'='*70}")
        self.log(f"📊 TEST SUMMARY")
        self.log(f"{'='*70}")
        
        total = len(results)
        correct = sum(1 for r in results.values() if r['correct'])
        high_conf = sum(1 for r in results.values() if r['confidence'] > 0.7)
        med_conf = sum(1 for r in results.values() if 0.3 < r['confidence'] <= 0.7)
        low_conf = sum(1 for r in results.values() if r['confidence'] <= 0.3)
        
        self.log(f"\n📈 Statistics:")
        self.log(f"   Total tests: {total}")
        self.log(f"   Correct predictions: {correct} ({correct/total*100:.1f}%)")
        self.log(f"   High confidence (>70%): {high_conf} ({high_conf/total*100:.1f}%)")
        self.log(f"   Medium confidence (30-70%): {med_conf} ({med_conf/total*100:.1f}%)")
        self.log(f"   Low confidence (<30%): {low_conf} ({low_conf/total*100:.1f}%)")
        
        avg_conf = sum(r['confidence'] for r in results.values()) / total
        self.log(f"   Average confidence: {avg_conf*100:.1f}%")
        
        # Detailed results
        self.log(f"\n{'='*70}")
        self.log(f"📋 DETAILED RESULTS")
        self.log(f"{'='*70}\n")
        
        for expected, result in results.items():
            status = "✅ CORRECT" if result['correct'] else "❌ WRONG"
            conf = result['confidence']
            
            if conf > 0.7:
                conf_status = "🟢 HIGH"
            elif conf > 0.3:
                conf_status = "🟡 MEDIUM"
            else:
                conf_status = "🔴 LOW"
            
            self.log(f"{status} | {conf_status}")
            self.log(f"   Expected:  {expected}")
            self.log(f"   Predicted: {result['predicted']} ({conf*100:.1f}%)")
            self.log("")
        
        # Diagnosis
        self.log(f"\n{'='*70}")
        self.log(f"🔍 DIAGNOSIS")
        self.log(f"{'='*70}\n")
        
        if avg_conf < 0.1:
            self.log("❌ CRITICAL: Average confidence below 10%")
            self.log("   Issue: Model file is likely corrupted or wrong")
            self.log("   Solution: Download a verified Food101 TFLite model")
        elif avg_conf < 0.3:
            self.log("⚠️  WARNING: Average confidence below 30%")
            self.log("   Issue: Model or preprocessing problem")
            self.log("   Solutions:")
            self.log("   1. Try different normalization (0-1 instead of -1-1)")
            self.log("   2. Verify model file integrity")
            self.log("   3. Check if labels.json matches model training")
        elif correct / total < 0.5:
            self.log("⚠️  WARNING: Accuracy below 50%")
            self.log("   Issue: Model might not be trained on these food types")
            self.log("   Solution: Verify this is a Food101 model")
        elif avg_conf > 0.7 and correct / total > 0.8:
            self.log("✅ EXCELLENT: Model is working well!")
            self.log("   High confidence and accurate predictions")
            self.log("   If Android app shows low confidence, it's a preprocessing issue")
        else:
            self.log("✓ MODERATE: Model working reasonably")
            self.log(f"   Accuracy: {correct/total*100:.1f}%")
            self.log(f"   Avg confidence: {avg_conf*100:.1f}%")
        
        self.log(f"\n{'='*70}")
        self.log(f"📄 Results saved to: {self.results_file}")
        self.log(f"{'='*70}\n")
        
        self.log_file.close()

def main():
    tester = CompleteModelTester()
    tester.run_full_test()

if __name__ == "__main__":
    main()
