
#!/usr/bin/env python3
"""
Convert trained .keras model to TFLite and CoreML formats
Usage: python convert_model.py path/to/model.keras
"""

import sys
import tensorflow as tf
from pathlib import Path

# Check if model path provided
if len(sys.argv) < 2:
    print("❌ Please provide path to .keras model file")
    print("Usage: python convert_model.py path/to/model.keras")
    sys.exit(1)

model_path = Path(sys.argv[1])
if not model_path.exists():
    print(f"❌ Model file not found: {model_path}")
    sys.exit(1)

print(f"✅ Loading model from: {model_path}")
model = tf.keras.models.load_model(model_path)

# Get number of classes
num_classes = model.output_shape[-1]
print(f"📊 Model has {num_classes} output classes")

# Step 1: Convert to TFLite (Android)
print("\n🔄 Converting to TensorFlow Lite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

tflite_path = 'vision_v1.tflite'
with open(tflite_path, 'wb') as f:
    f.write(tflite_model)

print(f"✅ TFLite model saved: {tflite_path} ({len(tflite_model)/1024/1024:.2f} MB)")

# Step 2: Convert to CoreML (iOS)
print("\n🔄 Converting to CoreML...")
print("Installing coremltools...")
import subprocess
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "protobuf==3.20.3", "coremltools"], check=True)

import coremltools as ct

# Food-101 dish categories (in alphabetical order)
categories = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
    'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
    'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
    'ceviche', 'cheese_plate', 'cheesecake', 'chicken_curry', 'chicken_quesadilla',
    'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
    'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
    'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
    'escargots', 'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras',
    'french_fries', 'french_onion_soup', 'french_toast', 'fried_calamari', 'fried_rice',
    'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
    'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup',
    'hot_dog', 'huevos_rancheros', 'hummus', 'ice_cream', 'lasagna',
    'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup',
    'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters',
    'pad_thai', 'paella', 'pancakes', 'panna_cotta', 'peking_duck',
    'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib',
    'pulled_pork_sandwich', 'ramen', 'ravioli', 'red_velvet_cake', 'risotto',
    'samosa', 'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits',
    'spaghetti_bolognese', 'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake',
    'sushi', 'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles'
]

coreml_model = ct.convert(
    model,
    inputs=[ct.ImageType(
        name="image",
        shape=(1, 224, 224, 3),
        scale=1/255.0,
        bias=[0, 0, 0]
    )],
    classifier_config=ct.ClassifierConfig(categories)
)

coreml_model.short_description = "Food classifier (101 dishes) for Gymie"
coreml_path = "vision_v1.mlmodel"
coreml_model.save(coreml_path)
print(f"✅ CoreML model saved: {coreml_path}")

# Step 3: Create labels file
print("\n📝 Creating labels file...")
labels_path = 'dish_labels.txt'
with open(labels_path, 'w') as f:
    for dish in categories:
        f.write(f"{dish}\n")
print(f"✅ Labels saved: {labels_path}")

print("\n" + "="*60)
print("🎉 Conversion complete!")
print("="*60)
print("\n📦 Generated files:")
print(f"  1. {tflite_path} - Android model")
print(f"  2. {coreml_path} - iOS model")
print(f"  3. {labels_path} - Dish labels")
print("\n📋 Next steps:")
print("  1. Copy vision_v1.tflite to: frontend/android/app/src/main/assets/")
print("  2. Copy vision_v1.mlmodel to: frontend/ios/")
print("  3. Copy dish_labels.txt to both directories above")
print("  4. Run: cd frontend && npx expo prebuild --clean")
print("  5. Test on device!")
