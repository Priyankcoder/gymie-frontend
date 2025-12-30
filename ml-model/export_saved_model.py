import keras
import os

MODEL_PATH = "/Users/priyank.rastogi@zomato.com/projects/Gymie/frontend/ml-model/final_model.keras"
EXPORT_DIR = "saved_model"

model = keras.models.load_model(MODEL_PATH)

# Keras 3 official export
model.export(EXPORT_DIR)

print("✅ SavedModel exported to:", os.path.abspath(EXPORT_DIR))
