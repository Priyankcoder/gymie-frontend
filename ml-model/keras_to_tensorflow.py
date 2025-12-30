import tensorflow as tf
from tensorflow import keras
import os

MODEL_PATH = "/Users/priyank.rastogi@zomato.com/projects/Gymie/frontend/ml-model/final_model.keras"
EXPORT_DIR = "saved_model_inference"

print("🔄 Loading Keras model...")
model = keras.models.load_model(MODEL_PATH, compile=False)

# 🔥 Strip augmentation layers
def strip_augmentation(model):
    x = model.input
    for layer in model.layers:
        if isinstance(layer, keras.Sequential):
            # Skip augmentation Sequential
            continue
        if layer.name.startswith(("random_", "augmentation")):
            continue
        x = layer(x)
    return keras.Model(model.input, x)

print("🧹 Removing augmentation layers...")
inference_model = strip_augmentation(model)

print("💾 Exporting inference SavedModel...")
tf.saved_model.save(inference_model, EXPORT_DIR)

print(f"✅ Saved inference model at: {os.path.abspath(EXPORT_DIR)}")
