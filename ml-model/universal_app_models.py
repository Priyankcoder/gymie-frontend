import json
import time
from pathlib import Path
import tensorflow as tf

# =============================
# CONFIG (HARDCODED PATHS)
# =============================

BASE_DIR = Path(
    "/Users/priyank.rastogi@zomato.com/projects/Gymie/frontend/ml-model"
)

MODEL_PATH = BASE_DIR / "final_model.keras"
LABELS_PATH = BASE_DIR / "labels.json"

assert MODEL_PATH.exists(), f"Model not found: {MODEL_PATH}"
assert LABELS_PATH.exists(), f"Labels not found: {LABELS_PATH}"

# =============================
# LOAD MODEL
# =============================

print("🔄 Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
model.summary()

# =============================
# LOAD LABELS
# =============================

print("🔄 Loading labels...")
with open(LABELS_PATH, "r") as f:
    class_names = json.load(f)

num_classes = len(class_names)
output_units = model.output_shape[-1]

assert num_classes == output_units, (
    f"Label count ({num_classes}) != model output ({output_units})"
)

print(f"✅ {num_classes} classes verified")

# =============================
# OUTPUT PATHS (NO OVERRIDE)
# =============================

ts = int(time.time())

TFLITE_PATH = BASE_DIR / f"vision_{ts}.tflite"
ONNX_PATH = BASE_DIR / f"vision_{ts}.onnx"
COREML_PATH = BASE_DIR / f"vision_{ts}.mlpackage"

print("\n📦 Output files:")
print(" -", TFLITE_PATH.name)
print(" -", ONNX_PATH.name)
print(" -", COREML_PATH.name)

# =============================
# TFLITE CONVERSION
# =============================

print("\n🔄 Converting to TFLite...")

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

with open(TFLITE_PATH, "wb") as f:
    f.write(tflite_model)

print("✅ TFLite saved")

# =============================
# ONNX CONVERSION
# =============================

print("\n🔄 Converting to ONNX...")

import tf2onnx

spec = (tf.TensorSpec(model.input_shape, tf.float32, name="input"),)

tf2onnx.convert.from_keras(
    model,
    input_signature=spec,
    opset=13,
    output_path=str(ONNX_PATH),
)

print("✅ ONNX saved")

# =============================
# COREML CONVERSION (macOS)
# =============================

print("\n🔄 Converting to CoreML...")

import coremltools as ct

mlmodel = ct.convert(
    model,
    source="tensorflow",
    inputs=[
        ct.ImageType(
            name="image",
            shape=(1, 224, 224, 3),
            scale=1 / 255.0,
        )
    ],
    classifier_config=ct.ClassifierConfig(class_names),
)

mlmodel.save(str(COREML_PATH))

print("✅ CoreML saved")

# =============================
# DONE
# =============================

print("\n🎉 Conversion complete")
print("Files saved in:", BASE_DIR)
