import coremltools as ct

MODEL_PATH = "saved_model"

print("🔄 Converting TensorFlow SavedModel → CoreML...")

mlmodel = ct.convert(
    MODEL_PATH,
    source="tensorflow",
    convert_to="mlprogram",
)

mlmodel.save("vision_v1.mlpackage")

print("✅ CoreML model saved as vision_v1.mlpackage")
