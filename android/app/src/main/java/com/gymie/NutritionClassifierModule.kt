
package com.gymie

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.json.JSONArray
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

class NutritionClassifierModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    private var interpreter: Interpreter? = null
    private var labels: List<String> = emptyList()
    private val MODEL_NAME = "vision_v1.tflite"
    private val LABELS_NAME = "labels.json"
    private val INPUT_SIZE = 192  // Updated for new model
    private val NUM_CLASSES = 2024  // Updated for new model

    init {
        loadModel()
    }

    override fun getName(): String {
        return "NutritionClassifier"
    }

    private fun loadModel() {
        try {
            // Load TFLite model
            val modelBuffer = FileUtil.loadMappedFile(reactApplicationContext, MODEL_NAME)
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(modelBuffer, options)

            // Load labels
            val labelsJson = reactApplicationContext.assets.open(LABELS_NAME)
                .bufferedReader()
                .use { it.readText() }
            
            val jsonArray = JSONArray(labelsJson)
            labels = (0 until jsonArray.length()).map { jsonArray.getString(it) }

            android.util.Log.d("NutritionClassifier", "Model loaded successfully. ${labels.size} labels.")
        } catch (e: Exception) {
            android.util.Log.e("NutritionClassifier", "Error loading model", e)
        }
    }

    @ReactMethod
    fun classifyImage(imageUri: String, promise: Promise) {
        try {
            if (interpreter == null) {
                promise.reject("MODEL_ERROR", "Model not loaded")
                return
            }

            // Load and preprocess image
            val bitmap = loadBitmapFromUri(imageUri)
            if (bitmap == null) {
                promise.reject("IMAGE_ERROR", "Failed to load image")
                return
            }

            val resizedBitmap = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
            val inputBuffer = bitmapToByteBuffer(resizedBitmap)

            // Run inference
            val outputBuffer = ByteBuffer.allocateDirect(NUM_CLASSES)
            outputBuffer.order(ByteOrder.nativeOrder())
            interpreter?.run(inputBuffer, outputBuffer)

            // Dequantize output (UINT8 to probabilities)
            outputBuffer.rewind()
            val predictions = FloatArray(NUM_CLASSES)
            for (i in 0 until NUM_CLASSES) {
                // Convert UINT8 (0-255) to probability (0-1)
                val quantizedValue = outputBuffer.get().toInt() and 0xFF
                predictions[i] = quantizedValue / 255.0f
            }

            // Get top predictions
            val topK = getTopK(predictions, 5)

            // Format result
            val result = Arguments.createMap().apply {
                val topLabel = if (topK[0].first < labels.size) {
                    labels[topK[0].first]
                } else {
                    "food_class_${topK[0].first}"
                }
                putString("label", topLabel)
                putDouble("confidence", topK[0].second.toDouble())
                
                val top5Array = Arguments.createArray()
                topK.forEach { (index, confidence) ->
                    val pred = Arguments.createMap().apply {
                        val label = if (index < labels.size) {
                            labels[index]
                        } else {
                            "food_class_$index"
                        }
                        putString("label", label)
                        putDouble("confidence", confidence.toDouble())
                    }
                    top5Array.pushMap(pred)
                }
                putArray("top5", top5Array)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("NutritionClassifier", "Classification error", e)
            promise.reject("CLASSIFICATION_ERROR", e.message, e)
        }
    }

    private fun loadBitmapFromUri(uriString: String): Bitmap? {
        return try {
            val uri = Uri.parse(uriString)
            val path = uri.path ?: return null
            BitmapFactory.decodeFile(path)
        } catch (e: Exception) {
            android.util.Log.e("NutritionClassifier", "Error loading bitmap", e)
            null
        }
    }

    private fun bitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        // Model is UINT8 quantized - allocate 1 byte per channel
        val byteBuffer = ByteBuffer.allocateDirect(INPUT_SIZE * INPUT_SIZE * 3)
        byteBuffer.order(ByteOrder.nativeOrder())

        val intValues = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        var pixel = 0
        for (i in 0 until INPUT_SIZE) {
            for (j in 0 until INPUT_SIZE) {
                val value = intValues[pixel++]
                
                // For UINT8 quantized model: directly use RGB values (0-255)
                byteBuffer.put((value shr 16 and 0xFF).toByte())  // R
                byteBuffer.put((value shr 8 and 0xFF).toByte())   // G
                byteBuffer.put((value and 0xFF).toByte())          // B
            }
        }

        return byteBuffer
    }

    private fun getTopK(predictions: FloatArray, k: Int): List<Pair<Int, Float>> {
        return predictions
            .mapIndexed { index, confidence -> Pair(index, confidence) }
            .sortedByDescending { it.second }
            .take(k)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        interpreter?.close()
        interpreter = null
    }
}
