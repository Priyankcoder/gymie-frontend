
# ML Model Testing Guide

## Issue Observed
Pizza image predicted as "cheese_plate" with only **1.5% confidence**. This indicates a potential model or preprocessing issue.

## Test the Model

### Step 1: Install Dependencies
```bash
cd frontend/ml-model
pip install tensorflow pillow numpy
```

### Step 2: Test with a Single Image
```bash
# Test with your pizza image
python test_model.py /path/to/your/pizza/image.jpg
```

### Step 3: Run Full Test Suite
```bash
# Create test images folder
mkdir test_images

# Add some test food images:
# - pizza.jpg
# - biryani.jpg  
# - burger.jpg
# - sushi.jpg
# etc.

# Run test suite
python test_model.py
```

## Expected Output

### Good Model:
```
🎯 Top 5 Predictions:
============================================================
🟢 #1: pizza                      85.23%
🟡 #2: cheese_pizza              10.45%
🟡 #3: margherita_pizza           3.12%
🔴 #4: calzone                    0.89%
🔴 #5: flatbread                  0.31%
```

### Bad Model (Current):
```
🎯 Top 5 Predictions:
============================================================
🔴 #1: cheese_plate               1.50%
🔴 #2: pizza                      1.20%
🔴 #3: something_else             0.98%
```

## Possible Issues

### 1. Wrong Model File
**Symptom:** All predictions have very low confidence (<5%)

**Solution:** The `vision_v1.tflite` might be corrupted or wrong
```bash
# Check model file
ls -lh vision_v1.tflite
# Should be ~30MB

# Verify it's a valid TFLite model
python -c "import tensorflow as tf; print(tf.lite.Interpreter('vision_v1.tflite'))"
```

### 2. Preprocessing Mismatch
**Symptom:** Wrong predictions but reasonable confidence

**Current preprocessing in Android:**
```kotlin
// Normalize to [-1, 1]
byteBuffer.putFloat(((value shr 16 and 0xFF) - 127.5f) / 127.5f)
byteBuffer.putFloat(((value shr 8 and 0xFF) - 127.5f) / 127.5f)
byteBuffer.putFloat(((value and 0xFF) - 127.5f) / 127.5f)
```

**Check if model needs different preprocessing:**
- Some models use [0, 1] normalization
- Some use ImageNet mean/std
- Some use [-1, 1] (current)

### 3. Wrong Labels File
**Symptom:** Predictions seem off by index

**Solution:** Verify labels match model training
```bash
# Check labels
cat labels.json | jq length  # Should be 101

# Verify "pizza" is in labels
cat labels.json | jq -r '.[]' | grep -i pizza
```

### 4. Input Size Mismatch
**Symptom:** Very low confidence for all images

**Check model input:**
```python
import tensorflow as tf
interpreter = tf.lite.Interpreter('vision_v1.tflite')
interpreter.allocate_tensors()
print(interpreter.get_input_details())
# Should show: 'shape': [1, 224, 224, 3]
```

## Debugging Steps

### 1. Test Model Locally First
```bash
python test_model.py your_pizza_image.jpg
```

### 2. Compare with Android Output
- Python test: If good predictions → Android preprocessing issue
- Python test: If bad predictions → Model file issue

### 3. Check Model Metadata
```python
import tensorflow as tf

interpreter = tf.lite.Interpreter('vision_v1.tflite')
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()[0]
print("Input:")
print(f"  Shape: {input_details['shape']}")
print(f"  Type: {input_details['dtype']}")
print(f"  Quantization: {input_details['quantization']}")

output_details = interpreter.get_output_details()[0]
print("\nOutput:")
print(f"  Shape: {output_details['shape']}")
print(f"  Type: {output_details['dtype']}")
```

## Quick Fixes

### Fix 1: Try Different Normalization
Edit `NutritionClassifierModule.kt`:

```kotlin
// Try [0, 1] normalization instead of [-1, 1]
byteBuffer.putFloat((value shr 16 and 0xFF) / 255.0f)
byteBuffer.putFloat((value shr 8 and 0xFF) / 255.0f)
byteBuffer.putFloat((value and 0xFF) / 255.0f)
```

### Fix 2: Try ImageNet Preprocessing
```kotlin
// ImageNet mean and std
val mean = floatArrayOf(0.485f, 0.456f, 0.406f)
val std = floatArrayOf(0.229f, 0.224f, 0.225f)

val r = (value shr 16 and 0xFF) / 255.0f
val g = (value shr 8 and 0xFF) / 255.0f
val b = (value and 0xFF) / 255.0f

byteBuffer.putFloat((r - mean[0]) / std[0])
byteBuffer.putFloat((g - mean[1]) / std[1])
byteBuffer.putFloat((b - mean[2]) / std[2])
```

## Get a Known Good Model

If testing shows the model is bad, get Food101 model:

```bash
# Download pre-trained Food101 model
wget https://storage.googleapis.com/tfhub-lite-models/tensorflow/lite-model/vision/classifier/food101/1/default/1.tflite

# Rename and test
mv 1.tflite vision_v1.tflite
python test_model.py your_image.jpg
```

## Test Results Template

Share your test results:
```
Model file size: ____ MB
Python test confidence: ____%
Android test confidence: ____%
Input shape from model: ____
Preprocessing method: ____
```

## Next Steps

1. Run `python test_model.py your_pizza.jpg`
2. Share the output
3. Based on results, we'll know if it's:
   - Model file issue
   - Preprocessing issue
   - Android-specific issue
