# Free Model Training Guide for Indian Food Classification

## Overview

This guide shows you how to train a MobileNet food classifier **completely for free** using publicly available datasets and cloud resources. You can train on your laptop or use free cloud GPUs.

## TL;DR - Quick Start

**🏆 RECOMMENDED: Use Kaggle** (Better than Colab!)
- **Time**: 1.5-2 hours training (faster!)
- **Cost**: $0
- **Accuracy**: 85-90%+ achievable
- **No disconnections!** ✨
- **Same Food-101 dataset** (101 dishes)

**Alternative: Google Colab** (If you prefer)
- Same Food-101 dataset
- Checkpoint support to handle disconnections
- 85%+ accuracy

## Why Kaggle is Better

| Feature | Kaggle | Google Colab |
|---------|--------|--------------|
| **Disconnections** | ❌ Rare (sessions more stable) | ✅ Frequent (every 12 hours) |
| **GPU** | P100 (40% faster) | T4 (slower) |
| **GPU Quota** | 30 hours/week guaranteed | Unpredictable |
| **Indian Dishes** | ~20 dishes | ~20 dishes |
| **Total Dishes** | 101 categories | 101 categories |
| **Dataset** | Pre-loaded (instant) | Manual download (~10 min) |
| **Accuracy** | 85-90% | 85-90% |
| **Setup** | 5 minutes | 10 minutes |

**Winner: Kaggle** 🎉

### Quick Start with Kaggle

1. **Sign up**: https://www.kaggle.com (free)
2. **Join Competition**: https://www.kaggle.com/competitions/food-recognition-2022
3. **Create Notebook**: Click "Code" → "New Notebook"
4. **Enable GPU**: Settings → Accelerator → GPU P100
5. **Run Training**: Click "Run All"
6. **Download Models**: From "Output" tab after 2-3 hours

See [`QUICK_START_KAGGLE.md`](./QUICK_START_KAGGLE.md) for detailed Kaggle guide.

### Google Colab (Alternative)

If you prefer Colab, we've added checkpoint support to handle disconnections automatically:

**🔄 Checkpoint Features:**
- ✅ Auto-saves after each epoch to Google Drive
- ✅ Resume training after disconnection
- ✅ Keeps training history across sessions
- ✅ No manual intervention needed

See [`COLAB_CHECKPOINT_GUIDE.md`](./COLAB_CHECKPOINT_GUIDE.md) and [`COLAB_RECOVERY_STEPS.md`](./COLAB_RECOVERY_STEPS.md) for Colab instructions.

---

## Part 1: Free Datasets

### Option 1: Food-101 Dataset (Recommended)
**Best starting point for transfer learning**

- **Source**: [ETH Zurich Food-101](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
- **Size**: 101,000 images across 101 food categories
- **Cost**: FREE
- **Quality**: High-resolution, diverse
- **Download**: ~5GB

**Indian dishes included**:
- Samosa
- Gulab jamun
- Chicken curry
- Tikka masala
- Pakora/Bhajji
- Dosa
- Biryani (limited)
- And more...

**Download command**:
```bash
# Download Food-101 dataset
wget http://data.vision.ee.ethz.ch/cvl/food-101.tar.gz
tar -xzf food-101.tar.gz
cd food-101
```

### Option 2: Indian Food Images Dataset (Kaggle)
**More focused on Indian cuisine**

- **Source**: [Kaggle - Indian Food Images](https://www.kaggle.com/datasets/iamsouravbanerjee/indian-food-images)
- **Size**: ~4,000 images across 80 Indian dishes
- **Cost**: FREE
- **Quality**: Good, but smaller dataset

**Download**:
```bash
# Install Kaggle CLI
pip install kaggle

# Configure API (get from kaggle.com/account)
# Place kaggle.json in ~/.kaggle/

# Download dataset
kaggle datasets download -d iamsouravbanerjee/indian-food-images
unzip indian-food-images.zip
```

### Option 3: Food Recognition Challenge Datasets
**Competition-grade datasets**

- **ISIA Food-500**: 500 categories, 400,000+ images
  - [Download here](https://www.aicrowd.com/challenges/food-recognition-challenge)
- **Recipe1M**: 1M+ recipes with images
  - [MIT CSAIL Link](http://im2recipe.csail.mit.edu/)

### Option 4: Web Scraping (Legal & Ethical)
**Build your own dataset**

```python
# Example using DuckDuckGo (respects robots.txt)
from duckduckgo_search import ddg_images
import requests
from pathlib import Path

def download_images(query, num_images=100):
    """Download images from DuckDuckGo"""
    results = ddg_images(query, max_results=num_images)
    
    output_dir = Path(f"dataset/{query}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for i, result in enumerate(results):
        try:
            response = requests.get(result['image'], timeout=5)
            if response.status_code == 200:
                with open(output_dir / f"{i:04d}.jpg", 'wb') as f:
                    f.write(response.content)
        except Exception as e:
            print(f"Error downloading {i}: {e}")

# Example usage
indian_dishes = [
    "butter chicken", "biryani", "dosa", "samosa",
    "paneer tikka", "dal makhani", "chole bhature"
]

for dish in indian_dishes:
    download_images(f"{dish} indian food", num_images=200)
```

**Important**: Respect copyright and use only for personal/educational purposes.

---

## Part 2: Free Training Resources

### Option 1: Google Colab (Recommended)
**Best for: Everyone, especially beginners**

- **GPU**: Free Tesla K80/T4
- **RAM**: 12-16 GB
- **Storage**: 15 GB
- **Time Limit**: 12 hours per session
- **Cost**: $0

**Pros**:
- No setup required
- Free GPU access
- Jupyter notebooks
- Pre-installed libraries

**Cons**:
- 12-hour session limit
- May disconnect randomly
- Slower than paid GPUs

**Setup**:
1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Create new notebook
3. Enable GPU: Runtime → Change runtime type → GPU

### Option 2: Kaggle Notebooks
**Best for: Dataset integration**

- **GPU**: Free Tesla P100 (better than Colab!)
- **RAM**: 16 GB
- **Storage**: 20 GB
- **Time Limit**: 30 hours/week
- **Cost**: $0

**Pros**:
- Better GPU than Colab
- Direct dataset access
- More stable sessions

**Cons**:
- Weekly time limit
- Requires Kaggle account

**Setup**:
1. Go to [kaggle.com](https://www.kaggle.com)
2. Create account
3. New Notebook → Settings → Accelerator → GPU

### Option 3: Your Laptop
**Best for: Small experiments, testing**

**Can you train on laptop?**
- ✅ YES, but slower
- ✅ Good for testing/debugging
- ⚠️ May take 6-12 hours vs 2-3 hours on GPU
- ⚠️ Requires 8GB+ RAM

**Laptop specs needed**:
- **Minimum**: Intel i5/Ryzen 5, 8GB RAM
- **Recommended**: Intel i7/Ryzen 7, 16GB RAM
- **GPU**: Optional, NVIDIA GPU helps but not required

**Training time comparison**:
- Laptop CPU: 8-12 hours
- Laptop with NVIDIA GPU: 3-4 hours
- Colab free GPU: 2-3 hours
- Kaggle P100 GPU: 1.5-2 hours

### Option 4: Lightning.ai (Free Tier)
**Best for: Advanced users**

- **GPU**: 22 GPU hours/month free
- **RAM**: Up to 32 GB
- **Storage**: 5 GB
- **Cost**: $0/month

**Setup**: [lightning.ai](https://lightning.ai)

---

## Part 3: Training Strategy

### Strategy 1: Transfer Learning (Recommended)
**Use pre-trained MobileNet, fine-tune for Indian food**

**Why?**
- Requires 100x less data
- Trains 10x faster
- Better accuracy with limited data
- Works even with 2,000-5,000 images

**Approach**:
```python
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV3Small
from tensorflow.keras import layers, models

# Load pre-trained MobileNet (trained on ImageNet)
base_model = MobileNetV3Small(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet',  # Pre-trained weights
    pooling='avg'
)

# Freeze base layers (don't retrain them)
base_model.trainable = False

# Add custom head for Indian food
model = models.Sequential([
    base_model,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation='softmax')
])

# Compile with lower learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train only the head (fast)
history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=10  # Just 10 epochs!
)
```

### Strategy 2: Data Augmentation
**Generate more training data from existing images**

```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Augment training data
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

# Load from directory
train_generator = train_datagen.flow_from_directory(
    'dataset/train',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical'
)
```

**Result**: Turn 5,000 images into 50,000+ variations!

---

## Part 4: Complete Training Script (Google Colab)

Here's a **ready-to-run** Colab notebook:

### Cell 1: Setup
```python
# Install dependencies
!pip install tensorflow pillow matplotlib

import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import json

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {tf.config.list_physical_devices('GPU')}")
```

### Cell 2: Download Dataset
```python
# Download Food-101 dataset (or upload your own)
!wget http://data.vision.ee.ethz.ch/cvl/food-101.tar.gz
!tar -xzf food-101.tar.gz

# List available categories
categories = sorted(Path('food-101/images').glob('*'))
print(f"Found {len(categories)} categories")
print("Sample categories:", [c.name for c in categories[:5]])
```

### Cell 3: Select Indian Dishes
```python
# Select only Indian dishes from Food-101
indian_dishes = [
    'samosa', 'gulab_jamun', 'chicken_curry', 
    'dosa', 'pakora', 'tikka_masala'
]

# Filter to selected dishes
selected_categories = [c for c in categories if c.name in indian_dishes]
print(f"Training on {len(selected_categories)} Indian dishes")
```

### Cell 4: Create Dataset
```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Data augmentation for training
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    validation_split=0.2  # 80% train, 20% validation
)

# Create generators
train_generator = train_datagen.flow_from_directory(
    'food-101/images',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training',
    classes=indian_dishes
)

val_generator = train_datagen.flow_from_directory(
    'food-101/images',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='validation',
    classes=indian_dishes
)

print(f"Training samples: {train_generator.n}")
print(f"Validation samples: {val_generator.n}")
```

### Cell 5: Build Model
```python
from tensorflow.keras.applications import MobileNetV3Small
from tensorflow.keras import layers, models

# Load pre-trained MobileNet
base_model = MobileNetV3Small(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet',
    pooling='avg'
)

# Freeze base model
base_model.trainable = False

# Build classifier
num_classes = len(indian_dishes)
model = models.Sequential([
    base_model,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

### Cell 6: Train Model (Phase 1 - Fast)
```python
# Train only the head (10 epochs, ~10 minutes)
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=10,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)
    ]
)

# Plot results
plt.plot(history.history['accuracy'], label='train')
plt.plot(history.history['val_accuracy'], label='val')
plt.legend()
plt.title('Phase 1: Head Training')
plt.show()
```

### Cell 7: Fine-tune (Phase 2 - Optional)
```python
# Unfreeze base model for fine-tuning
base_model.trainable = True

# Recompile with lower learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),  # Much lower!
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Fine-tune (10 more epochs, ~20 minutes)
history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=10,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)
    ]
)
```

### Cell 8: Convert to TensorFlow Lite
```python
# Convert to TFLite with optimization
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

# Save
with open('vision_v1.tflite', 'wb') as f:
    f.write(tflite_model)

print(f"TFLite model size: {len(tflite_model) / 1024 / 1024:.2f} MB")
```

### Cell 9: Convert to CoreML (iOS)
```python
!pip install coremltools

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
    classifier_config=ct.ClassifierConfig(indian_dishes)
)

# Set metadata
coreml_model.short_description = "Indian food classifier"
coreml_model.author = "Gymie"
coreml_model.license = "MIT"
coreml_model.version = "1.0.0"

# Save
coreml_model.save("vision_v1.mlmodel")
print("CoreML model saved!")
```

### Cell 10: Generate Labels
```python
# Save dish labels
with open('dish_labels.txt', 'w') as f:
    for dish in indian_dishes:
        f.write(f"{dish}\n")

print("Labels saved!")
```

### Cell 11: Download Models
```python
# Download to your computer
from google.colab import files

files.download('vision_v1.tflite')
files.download('vision_v1.mlmodel')
files.download('dish_labels.txt')

print("✅ Download complete! Add these files to your app.")
```

---

## Part 5: Training Timeline

### On Google Colab (Free GPU)

| Phase | Time | Description |
|-------|------|-------------|
| Setup | 5 min | Install dependencies |
| Download | 10 min | Food-101 dataset |
| Phase 1 | 15 min | Train classifier head |
| Phase 2 | 30 min | Fine-tune (optional) |
| Convert | 5 min | TFLite + CoreML |
| **Total** | **1 hour** | Complete pipeline |

### On Your Laptop (CPU)

| Phase | Time | Description |
|-------|------|-------------|
| Setup | 5 min | Same |
| Download | 10 min | Same |
| Phase 1 | 2 hours | Slower on CPU |
| Phase 2 | 4 hours | Much slower |
| Convert | 5 min | Same |
| **Total** | **6-7 hours** | Overnight training |

---

## Part 6: Optimizations for Limited Resources

### Use Fewer Images
```python
# Train on subset (faster iteration)
train_generator = train_datagen.flow_from_directory(
    'food-101/images',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training',
    classes=indian_dishes[:5]  # Only 5 dishes to start
)
```

### Reduce Batch Size
```python
# If running out of memory
batch_size = 16  # Instead of 32
```

### Use Mixed Precision
```python
# Faster training, less memory
from tensorflow.keras import mixed_precision
policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_global_policy(policy)
```

### Save Checkpoints
```python
# Save progress (in case Colab disconnects)
checkpoint = tf.keras.callbacks.ModelCheckpoint(
    'model_checkpoint.h5',
    save_best_only=True,
    monitor='val_accuracy'
)

model.fit(..., callbacks=[checkpoint])
```

---

## Part 7: Expected Results

### With 5,000 Images (Transfer Learning)
- **Accuracy**: 80-85%
- **Training Time**: 1-2 hours (GPU)
- **Model Size**: 8-10 MB

### With 10,000 Images
- **Accuracy**: 85-90%
- **Training Time**: 2-3 hours (GPU)
- **Model Size**: 8-10 MB

### With 50,000 Images
- **Accuracy**: 90-95%
- **Training Time**: 4-6 hours (GPU)
- **Model Size**: 8-10 MB

---

## Part 8: Next Steps After Training

1. **Download models** from Colab/Kaggle
2. **Copy to app**:
   ```bash
   cp vision_v1.tflite frontend/android/app/src/main/assets/
   cp vision_v1.mlmodel frontend/ios/
   cp dish_labels.txt frontend/android/app/src/main/assets/
   cp dish_labels.txt frontend/ios/
   ```
3. **Rebuild app**:
   ```bash
   cd frontend
   npx expo prebuild --clean
   npx expo run:android
   npx expo run:ios
   ```
4. **Test on device**
5. **Collect corrections** for retraining

---

## Resources

### Free Datasets
- [Food-101](http://data.vision.ee.ethz.ch/cvl/food-101/)
- [Kaggle Indian Food](https://www.kaggle.com/datasets/iamsouravbanerjee/indian-food-images)
- [Recipe1M](http://im2recipe.csail.mit.edu/)

### Free Compute
- [Google Colab](https://colab.research.google.com)
- [Kaggle Notebooks](https://www.kaggle.com)
- [Lightning.ai](https://lightning.ai)

### Learning
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)
- [Fast.ai Course](https://course.fast.ai/) (Free!)
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course)

---

## FAQ

**Q: Can I really train for free?**
A: Yes! Google Colab and Kaggle provide free GPUs.

**Q: How much data do I need?**
A: With transfer learning, 2,000-5,000 images is enough for 80%+ accuracy.

**Q: Can I use my MacBook?**
A: Yes, but it will be slower (6-8 hours vs 1-2 hours). M1/M2 Macs are quite fast though!

**Q: What if Colab disconnects?**
A: Use checkpoints to save progress. Free tier limits to 12 hours, but you can restart.

**Q: Do I need to know ML to do this?**
A: Not really! Just copy-paste the code cells above. But learning helps!

**Q: Can I use other cloud providers?**
A: AWS/GCP/Azure have free tiers, but they're more complex. Colab is easiest.

---

## Conclusion

You **can** train a production-quality model completely for free using:
- **Data**: Food-101 + Kaggle datasets
- **Compute**: Google Colab free GPU
- **Time**: 1-2 hours
- **Cost**: $0

The code above is ready to run. Just copy it to a Colab notebook and execute cell by cell!
