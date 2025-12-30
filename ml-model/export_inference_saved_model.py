import tensorflow as tf

MODEL_PATH = "final_model.keras"
EXPORT_PATH = "saved_model_clean"

print("🔄 Loading Keras model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# Explicit inference function
@tf.function(
    input_signature=[
        tf.TensorSpec(
            shape=[None, 224, 224, 3],
            dtype=tf.float32,
            name="input"
        )
    ]
)
def serving_fn(inputs):
    return {"output": model(inputs, training=False)}

print("💾 Exporting clean SavedModel (single concrete function)...")
tf.saved_model.save(
    model,
    EXPORT_PATH,
    signatures={"serving_default": serving_fn}
)

print("✅ Clean SavedModel exported to:", EXPORT_PATH)
