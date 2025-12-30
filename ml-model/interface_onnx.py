import keras

model = keras.models.load_model(
    "final_model.keras",
    compile=False
)

# Remove augmentation by rebuilding model
inputs = model.input
x = inputs

for layer in model.layers:
    if "random" in layer.name.lower():
        continue
    x = layer(x)

inference_model = keras.Model(inputs, x)

inference_model.export("saved_model_inference")