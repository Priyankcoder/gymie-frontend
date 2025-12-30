# ML Model Setup Guide

This guide explains how to integrate the trained MobileNet food classifier models into the Gymie app.

## Overview

The app uses TensorFlow Lite (Android) and CoreML (iOS) for on-device food classification. The infrastructure is ready, but requires trained model files to be added.

## Model Requirements

### Android (TensorFlow Lite)
- **Format**: `.tflite`
- **Model Name**: `vision_v1.tflite`
- **Input**: 224x224 RGB image (normalized to [0, 1])
- **Output**: Probability distribution over dish classes
- **Location**: `frontend/android/app/src/main/assets/vision_v1.tflite`

### iOS (CoreML)
- **Format**: `.mlmodel` (compiled to `.mlmodelc`)
- **Model Name**: `vision_v1.mlmodel`
- **Input**: 224x224 RGB image
- **Output**: Probability distribution over dish classes
- **Location**: `frontend/ios/vision_v1.mlmodel`

## Model Training

### 1. Dataset Preparation
```bash
# Structure your dataset
dataset/
├── aloo_paratha/
│   ├── img_001.jpg
│   ├── img_002.jpg
│   └── ...
├── butter_chicken/
│   └── ...
└── biryani/
    └── ...
```

### 2. Train MobileNetV3-Small
```python
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV3Small

# Load base model
base_model = MobileNetV3Small(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet',
    pooling='avg'
)

# Freeze base layers
base_model.trainable = False

# Add classification head
model = models.Sequential([
    base_model,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation='softmax')
])

# Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train
history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=20
)

# Fine-tune
base_model.trainable = True
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=10
)
```

### 3. Convert to TensorFlow Lite
```python
# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

# Save
with open('vision_v1.tflite', 'wb') as f:
    f.write(tflite_model)

# Generate labels
with open('dish_labels.txt', 'w') as f:
    for label in class_names:
        f.write(f"{label}\n")
```

### 4. Convert to CoreML (iOS)
```python
import coremltools as ct

# Convert to CoreML
coreml_model = ct.convert(
    model,
    inputs=[ct.ImageType(
        name="image",
        shape=(1, 224, 224, 3),
        scale=1/255.0,
        bias=[0, 0, 0]
    )],
    classifier_config=ct.ClassifierConfig(class_labels)
)

# Set metadata
coreml_model.short_description = "Food classifier for Indian dishes"
coreml_model.author = "Gymie ML Team"
coreml_model.license = "MIT"
coreml_model.version = "1.0.0"

# Save
coreml_model.save("vision_v1.mlmodel")
```

## Adding Models to the App

### Android
1. Place the trained model in assets:
```bash
cp vision_v1.tflite frontend/android/app/src/main/assets/
```

2. Update labels file if needed:
```bash
cp dish_labels.txt frontend/android/app/src/main/assets/
```

3. Rebuild the app:
```bash
cd frontend
npx expo prebuild --clean
npx expo run:android
```

### iOS
1. Add model to Xcode project:
   - Open `frontend/ios/Gymie.xcworkspace`
   - Drag `vision_v1.mlmodel` into the project navigator
   - Check "Copy items if needed"
   - Select "Gymie" target

2. Update labels file if needed:
   - Add `dish_labels.txt` to Xcode project similarly

3. Rebuild:
```bash
cd frontend
npx expo prebuild --clean
npx expo run:ios
```

## Testing the Integration

### 1. Initialize the Model
```typescript
import { mlInferenceService } from '@/services/mlInferenceService';

// In your app initialization
await mlInferenceService.initialize();
```

### 2. Classify an Image
```typescript
const result = await mlInferenceService.classifyImage(imageUri);
console.log('Prediction:', result);
// {
//   dishId: 'butter_chicken',
//   dishName: 'Butter Chicken',
//   confidence: 0.94,
//   inferenceTimeMs: 45
// }
```

### 3. Get Top-K Predictions
```typescript
const predictions = await mlInferenceService.classifyTopK(imageUri, 5);
predictions.forEach(p => {
  console.log(`${p.dishName}: ${(p.confidence * 100).toFixed(1)}%`);
});
```

## Model Performance Targets

- **Accuracy**: >85% top-1, >95% top-3
- **Inference Time**: <100ms on mid-range devices
- **Model Size**: <10MB (TFLite), <15MB (CoreML)
- **Memory**: <200MB peak during inference

## Model Versioning

The model filename includes a version identifier (`vision_v1`). When updating models:

1. Increment version (e.g., `vision_v2.tflite`)
2. Update model name in native code:
   - Android: `NutritionClassifierModule.kt` → `MODEL_NAME`
   - iOS: `NutritionClassifier.swift` → `MODEL_NAME`
3. Test thoroughly before deploying

## Placeholder Models

Currently, placeholder model files are **not** included. The app will gracefully handle missing models:
- Initialization will fail with clear error message
- UI will show "Model not available" state
- No app crashes

To add placeholder models for testing:
```bash
# Create dummy TFLite model (won't work but won't crash)
touch frontend/android/app/src/main/assets/vision_v1.tflite

# For iOS, use a minimal CoreML model
```

## Troubleshooting

### Android
- **Error: "Model file not found"**
  - Ensure `vision_v1.tflite` exists in `assets/` directory
  - Rebuild with `npx expo prebuild --clean`

- **Error: "Failed to load model"**
  - Check model format (must be `.tflite`)
  - Verify model is not corrupted
  - Check Android logs: `adb logcat | grep NutritionClassifier`

### iOS
- **Error: "Model not found in bundle"**
  - Verify model is added to Xcode project
  - Check "Copy Bundle Resources" in Build Phases
  - Clean build folder (Cmd+Shift+K)

- **Error: "Failed to compile model"**
  - Ensure model is `.mlmodel` format
  - Try recompiling: `xcrun coremlcompiler compile model.mlmodel .`

## Next Steps

1. **Collect Training Data**: Gather 10,000+ labeled food images
2. **Train Model**: Use transfer learning on MobileNetV3
3. **Optimize**: Quantize for mobile deployment
4. **Validate**: Test on diverse lighting/angles
5. **Deploy**: Add to app assets and release update

## Resources

- [TensorFlow Lite Guide](https://www.tensorflow.org/lite)
- [Core ML Documentation](https://developer.apple.com/documentation/coreml)
- [MobileNet Paper](https://arxiv.org/abs/1905.02244)
- [Food-101 Dataset](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
