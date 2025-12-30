
#!/bin/bash
set -e

echo "🔧 Setting up Python environment for model conversion..."

# Try to find a compatible Python version (3.9, 3.10, 3.11, or 3.12)
PYTHON_CMD=""
for version in python3.12 python3.11 python3.10 python3.9 python3; do
    if command -v $version &> /dev/null; then
        PYTHON_VER=$($version --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
        MAJOR=$(echo $PYTHON_VER | cut -d. -f1)
        MINOR=$(echo $PYTHON_VER | cut -d. -f2)
        
        # TensorFlow supports Python 3.9-3.12
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 9 ] && [ "$MINOR" -le 12 ]; then
            PYTHON_CMD=$version
            echo "✅ Found compatible Python: $($version --version)"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ No compatible Python version found (need 3.9-3.12)"
    echo "Your Python 3.14 is too new for TensorFlow"
    echo ""
    echo "Please install Python 3.12:"
    echo "  brew install python@3.12"
    echo ""
    echo "Then run this script again"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
cd "$(dirname "$0")"
rm -rf ml_env  # Clean up any existing env
$PYTHON_CMD -m venv ml_env

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source ml_env/bin/activate

# Upgrade pip
echo "📥 Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel

# Install TensorFlow and CoreMLTools with compatible versions
echo "📥 Installing TensorFlow and CoreMLTools (this may take 2-3 minutes)..."
# Install TensorFlow first
pip install tensorflow tensorflow-datasets

# Install CoreMLTools - it will use compatible protobuf version
pip install coremltools

echo "✅ Installation complete!"
echo ""
echo "🚀 Now running model conversion..."
echo ""

# Run conversion
python convert_model.py ../ml-model/final_model.keras

echo ""
echo "✅ Conversion complete!"
echo ""
echo "📦 Generated files are in: frontend/docs/"
echo "  - vision_v1.tflite (Android)"
echo "  - vision_v1.mlmodel (iOS)"
echo "  - dish_labels.txt (Labels)"
echo ""
echo "📋 Next steps:"
echo "  1. Copy vision_v1.tflite to: android/app/src/main/assets/"
echo "  2. Copy vision_v1.mlmodel to: ios/"
echo "  3. Copy dish_labels.txt to both directories above"
echo ""
echo "🧹 To cleanup: rm -rf frontend/docs/ml_env"
