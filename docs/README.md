# Machine Learning Documentation

This directory contains ML model training notebooks and documentation.

## Important: Virtual Environments

**NEVER commit virtual environments to git!**

If you need to create a Python virtual environment for training:

1. Create it OUTSIDE this directory:
```bash
# Create it in your home directory or a separate location
python3 -m venv ~/ml_envs/gymie_ml
source ~/ml_envs/gymie_ml/bin/activate  # On macOS/Linux
```

2. Or if you must create it here, it will be automatically ignored by `.gitignore`

## Files in this directory

- **Training Notebooks**: Various Jupyter notebooks for model training
- **Conversion Scripts**: Scripts to convert models to TensorFlow Lite format
- **Model Files**: `vision_v1.tflite` - The trained model (kept in git)
- **Documentation**: Guides for training and setup

## Setup for ML Training

```bash
# Create virtual environment OUTSIDE this repo
cd ~
python3 -m venv ml_env
source ml_env/bin/activate

# Install dependencies
pip install tensorflow jupyter numpy pillow

# Navigate back to docs folder
cd /path/to/Gymie/frontend/docs

# Run Jupyter
jupyter notebook
```
