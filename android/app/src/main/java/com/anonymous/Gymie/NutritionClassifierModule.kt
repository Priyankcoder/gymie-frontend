
package com.anonymous.Gymie

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader

class NutritionClassifierModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var interpreter: Interpreter? = null
    private var labels: List<String> = emptyList()
    
    companion object {
        const val NAME = "NutritionClassifier"
        const val IMAGE_SIZE = 192  // Actual model expects 192x192
        const val NUM_CLASSES = 2024
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            // Load TFLite model
            val modelPath = "vision_v1.tflite"
            val assetManager = reactApplicationContext.assets
            val modelBuffer = loadModelFile(modelPath)
            
            val options = Interpreter.Options()
            options.setNumThreads(4)
            interpreter = Interpreter(modelBuffer, options)
            
            // Load labels
            val labelsPath = "labels.json"
            val labelsJson = assetManager.open(labelsPath).bufferedReader().use { it.readText() }
            val jsonArray = JSONArray(labelsJson)
            labels = (0 until jsonArray.length()).map { jsonArray.getString(it) }
            
            promise.resolve("Model initialized successfully")
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize model: ${e.message}", e)
        }
    }

    @ReactMethod
    fun classifyImage(imageUri: String, promise: Promise) {
        try {
            if (interpreter == null || labels.isEmpty()) {
                promise.reject("NOT_INITIALIZED", "Model not initialized. Call initialize() first.")
                return
            }

            // Load image from file URI
            val uri = android.net.Uri.parse(imageUri)
            val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (bitmap == null) {
                promise.reject("IMAGE_ERROR", "Failed to decode image from URI: $imageUri")
                return
            }
            
            // Preprocess image
            val resizedBitmap = Bitmap.createScaledBitmap(bitmap, IMAGE_SIZE, IMAGE_SIZE, true)
            val inputBuffer = preprocessImage(resizedBitmap)
            
            // Run inference - Model outputs UINT8
            val outputArray = Array(1) { ByteArray(NUM_CLASSES) }
            interpreter?.run(inputBuffer, outputArray)
            
            // Dequantize UINT8 output to probabilities [0, 1]
            val predictions = outputArray[0].map { byte ->
                (byte.toInt() and 0xFF) / 255.0f
            }
            
            // Get top predictions
            val topIndices = predictions.indices.sortedByDescending { predictions[it] }.take(5)
            
            val results = WritableNativeArray()
            for (index in topIndices) {
                val result = WritableNativeMap()
                result.putString("label", labels.getOrElse(index) { "Unknown_$index" })
                result.putDouble("confidence", predictions[index].toDouble())
                results.pushMap(result)
            }
            
            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("CLASSIFICATION_ERROR", "Failed to classify image: ${e.message}", e)
        }
    }

    private fun loadModelFile(modelPath: String): MappedByteBuffer {
        val fileDescriptor = reactApplicationContext.assets.openFd(modelPath)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    private fun preprocessImage(bitmap: Bitmap): ByteBuffer {
        // Actual model expects UINT8 input (raw RGB 0-255)
        // Input size: 192x192x3, Type: UINT8
        val inputBuffer = ByteBuffer.allocateDirect(IMAGE_SIZE * IMAGE_SIZE * 3)
        inputBuffer.order(ByteOrder.nativeOrder())
        
        val pixels = IntArray(IMAGE_SIZE * IMAGE_SIZE)
        bitmap.getPixels(pixels, 0, IMAGE_SIZE, 0, 0, IMAGE_SIZE, IMAGE_SIZE)
        
        for (pixel in pixels) {
            // Extract raw RGB bytes (0-255)
            val r = ((pixel shr 16) and 0xFF).toByte()
            val g = ((pixel shr 8) and 0xFF).toByte()
            val b = (pixel and 0xFF).toByte()
            
            inputBuffer.put(r)
            inputBuffer.put(g)
            inputBuffer.put(b)
        }
        
        return inputBuffer
    }

    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            interpreter?.close()
            interpreter = null
            labels = emptyList()
            promise.resolve("Cleanup successful")
        } catch (e: Exception) {
            promise.reject("CLEANUP_ERROR", "Failed to cleanup: ${e.message}", e)
        }
    }
}
