
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
    private val INPUT_SIZE = 224
    private val NUM_CLASSES = 101

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
            val output = Array(1) { FloatArray(NUM_CLASSES) }
            interpreter?.run(inputBuffer, output)

            // Get top predictions
            val predictions = output[0]
            val topK = getTopK(predictions, 5)

            // Format result
            val result = Arguments.createMap().apply {
                putString("label", labels[topK[0].first])
                putDouble("confidence", topK[0].second.toDouble())
                
                val top5Array = Arguments.createArray()
                topK.forEach { (index, confidence) ->
                    val pred = Arguments.createMap().apply {
                        putString("label", labels[index])
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
        val byteBuffer = ByteBuffer.allocateDirect(4 * INPUT_SIZE * INPUT_SIZE * 3)
        byteBuffer.order(ByteOrder.nativeOrder())

        val intValues = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        var pixel = 0
        for (i in 0 until INPUT_SIZE) {
            for (j in 0 until INPUT_SIZE) {
                val value = intValues[pixel++]
                
                // Normalize to [-1, 1]
                byteBuffer.putFloat(((value shr 16 and 0xFF) - 127.5f) / 127.5f)
                byteBuffer.putFloat(((value shr 8 and 0xFF) - 127.5f) / 127.5f)
                byteBuffer.putFloat(((value and 0xFF) - 127.5f) / 127.5f)
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
