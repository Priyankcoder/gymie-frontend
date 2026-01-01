
# 🧪 Run Complete Model Test

## Quick Start

```bash
cd frontend/ml-model
python test_model_complete.py
```

That's it! The script will:
1. ✅ Install dependencies automatically (tensorflow, pillow)
2. ✅ Download 8 test food images from Wikipedia
3. ✅ Load your vision_v1.tflite model
4. ✅ Run predictions on all images
5. ✅ Generate detailed report with diagnosis

## What It Tests

Test images automatically downloaded:
- 🍕 Pizza
- 🍔 Burger
- 🍣 Sushi
- 🍦 Ice Cream
- 🍟 French Fries
- 🌭 Hot Dog
- 🍗 Chicken Wings
- 🥗 Caesar Salad

## Expected Output

### If Model is Good:
```
📊 TEST SUMMARY
========================================================================

📈 Statistics:
   Total tests: 8
   Correct predictions: 7 (87.5%)
   High confidence (>70%): 6 (75.0%)
   Average confidence: 78.3%

🔍 DIAGNOSIS
========================================================================

✅ EXCELLENT: Model is working well!
   High confidence and accurate predictions
   If Android app shows low confidence, it's a preprocessing issue
```

### If Model is Bad (Your Current Case):
```
📊 TEST SUMMARY
========================================================================

📈 Statistics:
   Total tests: 8
   Correct predictions: 1 (12.5%)
   Low confidence (<30%): 8 (100.0%)
   Average confidence: 1.8%

🔍 DIAGNOSIS
========================================================================

❌ CRITICAL: Average confidence below 10%
   Issue: Model file is likely corrupted or wrong
   Solution: Download a verified Food101 TFLite model
```

## Results File

All results are saved to: `test_results_YYYYMMDD_HHMMSS.txt`

You can share this file for debugging!

## Interpreting Results

### Confidence Levels:
- 🟢 **>70%** = High (Model is confident)
- 🟡 **30-70%** = Medium (Model is unsure)
- 🔴 **<30%** = Low (Model has no idea)

### Your Case: 1.5% confidence
This means the model is essentially guessing randomly.

## Common Issues

### Issue 1: All predictions <10% confidence
**Cause:** Wrong or corrupted model file

**Fix:**
```bash
# Download verified Food101 model
wget https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1?lite-format=tflite -O vision_v1_verified.tflite

# Test it
python test_model_complete.py
# (edit script to use vision_v1_verified.tflite)
```

### Issue 2: Python works, Android doesn't
**Cause:** Preprocessing mismatch

**Fix:** Update Android normalization in `NutritionClassifierModule.kt`

### Issue 3: Wrong predictions but high confidence
**Cause:** Labels.json doesn't match model

**Fix:** Get matching labels file from model source

## Next Steps After Running

1. **Run the test:**
   ```bash
   python test_model_complete.py
   ```

2. **Check the results file**

3. **If average confidence < 10%:**
   - Your model file is wrong/corrupted
   - Need to get a working Food101 TFLite model

4. **If average confidence > 70%:**
   - Model is good!
   - Issue is in Android preprocessing
   - I'll fix the Android code

5. **Share results with me:**
   - Paste the TEST SUMMARY section
   - Or share the full results .txt file

## Manual Test with Your Own Image

```bash
python test_model.py /path/to/your/image.jpg
```

## Questions?

The test automatically diagnoses the issue and suggests solutions.
Just run it and share the output! 🚀
