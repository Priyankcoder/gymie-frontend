import keras
import tf2onnx
import onnx

MODEL_PATH = "/Users/priyank.rastogi@zomato.com/projects/Gymie/frontend/ml-model/final_model.keras"
ONNX_PATH = "vision_v1.onnx"

# Load Keras 3 model
model = keras.models.load_model(MODEL_PATH)

# Convert to ONNX
onnx_model, _ = tf2onnx.convert.from_keras(
    model,
    opset=13,
    output_path=ONNX_PATH
)

print("✅ ONNX model saved to:", ONNX_PATH)
