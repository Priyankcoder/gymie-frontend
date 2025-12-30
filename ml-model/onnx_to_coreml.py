import coremltools as ct

ONNX_MODEL_PATH = "vision_v1.onnx"
COREML_OUTPUT_PATH = "vision_v1.mlmodel"

print("🔄 Converting ONNX → CoreML...")

mlmodel = ct.converters.onnx.convert(
    model=ONNX_MODEL_PATH,
    minimum_deployment_target=ct.target.iOS15
)

mlmodel.save(COREML_OUTPUT_PATH)

print("✅ CoreML model saved:", COREML_OUTPUT_PATH)
