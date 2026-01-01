
#!/bin/bash

echo "=============================================="
echo "🔍 Verifying Google AIY Food Classifier Setup"
echo "=============================================="
echo ""

ERROR_COUNT=0

# Check 1: Model file
echo "📦 1. Checking model file..."
MODEL_PATH="../android/app/src/main/assets/vision_v1.tflite"
if [ -f "$MODEL_PATH" ]; then
    SIZE=$(du -h "$MODEL_PATH" | cut -f1)
    echo "   ✅ Model exists: $SIZE"
else
    echo "   ❌ Model file not found at: $MODEL_PATH"
    ((ERROR_COUNT++))
fi

# Check 2: Labels file
echo ""
echo "📝 2. Checking labels file..."
LABELS_PATH="../android/app/src/main/assets/labels.json"
if [ -f "$LABELS_PATH" ]; then
    LABEL_COUNT=$(python3 -c "import json; print(len(json.load(open('$LABELS_PATH'))))" 2>/dev/null || echo "?")
    echo "   ✅ Labels exist: $LABEL_COUNT items"
    
    # Verify it's not just IDs
    FIRST_LABEL=$(python3 -c "import json; print(json.load(open('$LABELS_PATH'))[1])" 2>/dev/null || echo "")
    if [ "$FIRST_LABEL" = "1" ]; then
        echo "   ⚠️  WARNING: Labels appear to be IDs, not food names!"
        echo "   Run: cd frontend/ml-model && python3 fix_labels.py"
        ((ERROR_COUNT++))
    else
        echo "   ✅ Labels contain food names (e.g., '$FIRST_LABEL')"
    fi
else
    echo "   ❌ Labels file not found at: $LABELS_PATH"
    ((ERROR_COUNT++))
fi

# Check 3: Native module
echo ""
echo "🔧 3. Checking native module..."
NATIVE_MODULE="../android/app/src/main/java/com/gymie/NutritionClassifierModule.kt"
if [ -f "$NATIVE_MODULE" ]; then
    echo "   ✅ Native module exists"
    
    # Check for correct constants
    if grep -q "INPUT_SIZE = 192" "$NATIVE_MODULE"; then
        echo "   ✅ INPUT_SIZE correctly set to 192"
    else
        echo "   ⚠️  WARNING: INPUT_SIZE might not be 192"
        ((ERROR_COUNT++))
    fi
    
    if grep -q "NUM_CLASSES = 2024" "$NATIVE_MODULE"; then
        echo "   ✅ NUM_CLASSES correctly set to 2024"
    else
        echo "   ⚠️  WARNING: NUM_CLASSES might not be 2024"
        ((ERROR_COUNT++))
    fi
else
    echo "   ❌ Native module not found at: $NATIVE_MODULE"
    ((ERROR_COUNT++))
fi

# Check 4: Module registration
echo ""
echo "📱 4. Checking module registration..."
MAIN_APP="../android/app/src/main/java/com/gymie/MainApplication.kt"
if [ -f "$MAIN_APP" ]; then
    if grep -q "NutritionClassifierPackage" "$MAIN_APP"; then
        echo "   ✅ Module registered in MainApplication"
    else
        echo "   ⚠️  WARNING: Module might not be registered"
        ((ERROR_COUNT++))
    fi
else
    echo "   ⚠️  MainApplication.kt not found"
fi

# Check 5: TypeScript integration
echo ""
echo "💻 5. Checking TypeScript integration..."
TS_HOOK="../src/hooks/nutrition/useOfflineNutrition.ts"
if [ -f "$TS_HOOK" ]; then
    if grep -q "recognizeFoodFromImage" "$TS_HOOK"; then
        echo "   ✅ Recognition hook implemented"
    else
        echo "   ⚠️  WARNING: Recognition might not be implemented"
    fi
else
    echo "   ⚠️  Hook file not found"
fi

# Summary
echo ""
echo "=============================================="
if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo "=============================================="
    echo ""
    echo "🚀 Ready to build! Run:"
    echo "   cd .."
    echo "   npm run android"
else
    echo "⚠️  FOUND $ERROR_COUNT ISSUE(S)"
    echo "=============================================="
    echo ""
    echo "Please fix the issues above before building."
fi
echo ""
