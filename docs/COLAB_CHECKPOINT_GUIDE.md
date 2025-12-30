
# Google Colab Checkpoint Guide - Never Lose Training Progress! 🔄

## 🚨 Quick Recovery Guide - Runtime Disconnected?

**If your Colab runtime disconnects during training, follow these 7 simple steps:**

1. **Reconnect** → Click "Reconnect" button (top-right corner)
2. **Run Step 1** → GPU setup cell (installs TensorFlow, etc.)
3. **Run Step 2** → Mount Google Drive (loads your checkpoints)
4. **Skip Step 3** → Dataset already downloaded (unless deleted)
5. **Run Steps 4-5** → Category selection + data generators
6. **Run Step 6** → Model building
7. **Run Step 7 or 8** → Training cell (automatically resumes!)

**That's it!** Training will automatically:
- ✅ Detect your saved checkpoint in Google Drive
- ✅ Load the model from the last completed epoch
- ✅ Continue training without losing any progress

**You'll see:**
```
🔄 Found checkpoint: /content/drive/MyDrive/gymie_checkpoints/phase1_checkpoint.keras
✅ Checkpoint loaded successfully!
📊 Resuming from epoch 8
🚀 Phase 1: Training classifier head
🔢 Starting from epoch: 8
🎯 Target epochs: 15
```

---

## Problem
Google Colab free tier disconnects after 12 hours or periods of inactivity, causing you to lose training progress.

## Solution: Checkpointing with Google Drive

### Quick Setup (Add to Your Notebook)

#### 1. Mount Google Drive (Add at the beginning)

```python
# Mount Google Drive to save checkpoints
from google.colab import drive
drive.mount('/content/drive')

# Create checkpoint directory
import os
checkpoint_dir = '/content/drive/MyDrive/gymie_checkpoints'
os.makedirs(checkpoint_dir, exist_ok=True)
print(f"✅ Checkpoints will be saved to: {checkpoint_dir}")
```

#### 2. Add Checkpoint Callback (Before model.fit())

```python
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

# Define callbacks
checkpoint_path = f'{checkpoint_dir}/food_classifier_checkpoint.h5'
best_model_path = f'{checkpoint_dir}/food_classifier_best.h5'

callbacks = [
    # Save checkpoint after every epoch
    ModelCheckpoint(
        checkpoint_path,
        save_weights_only=True,
        save_freq='epoch',
        verbose=1
    ),
    
    # Save best model based on validation accuracy
    ModelCheckpoint(
        best_model_path,
        monitor='val_accuracy',
        save_best_only=True,
        save_weights_only=True,
        mode='max',
        verbose=1
    ),
    
    # Stop if no improvement for 5 epochs
    EarlyStopping(
        monitor='val_accuracy',
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    
    # Reduce learning rate if plateau
    ReduceLROnPlateau(
        monitor='val_accuracy',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

print("✅ Callbacks configured")
```

#### 3. Check for Existing Checkpoint (Before training)

```python
# Check if checkpoint exists and load it
initial_epoch = 0

if os.path.exists(checkpoint_path):
    print(f"🔄 Found existing checkpoint: {checkpoint_path}")
    try:
        model.load_weights(checkpoint_path)
        print("✅ Checkpoint loaded successfully!")
        
        # Ask user which epoch to resume from
        print("\nTo resume training, specify the epoch number you want to continue from.")
        print("(Check the checkpoint filename or previous training logs)")
        
        # In a real scenario, you might parse this from a training log file
        # For now, you can manually set it
        initial_epoch = 0  # Set this to the last completed epoch
        print(f"Resuming from epoch {initial_epoch}")
        
    except Exception as e:
        print(f"⚠️ Error loading checkpoint: {e}")
        print("Starting training from scratch...")
else:
    print("📝 No existing checkpoint found. Starting fresh training...")
```

#### 4. Update model.fit() Call

```python
# Train with checkpointing
history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=20,
    initial_epoch=initial_epoch,  # Resume from this epoch
    callbacks=callbacks,  # Add callbacks
    verbose=1
)
```

## Complete Updated Training Cell

Replace your training cell with this:

```python
# ============================================
# CHECKPOINT SETUP
# ============================================

from google.colab import drive
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import os

# Mount Google Drive
drive.mount('/content/drive')
checkpoint_dir = '/content/drive/MyDrive/gymie_checkpoints'
os.makedirs(checkpoint_dir, exist_ok=True)

# Define checkpoint paths
checkpoint_path = f'{checkpoint_dir}/food_classifier_checkpoint.h5'
best_model_path = f'{checkpoint_dir}/food_classifier_best.h5'
history_path = f'{checkpoint_dir}/training_history.json'

# Configure callbacks
callbacks = [
    ModelCheckpoint(
        checkpoint_path,
        save_weights_only=True,
        save_freq='epoch',
        verbose=1
    ),
    ModelCheckpoint(
        best_model_path,
        monitor='val_accuracy',
        save_best_only=True,
        save_weights_only=True,
        mode='max',
        verbose=1
    ),
    EarlyStopping(
        monitor='val_accuracy',
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_accuracy',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

# Check for existing checkpoint
initial_epoch = 0
if os.path.exists(checkpoint_path):
    print(f"🔄 Loading checkpoint from: {checkpoint_path}")
    try:
        model.load_weights(checkpoint_path)
        
        # Try to load training history to determine epoch
        if os.path.exists(history_path):
            import json
            with open(history_path, 'r') as f:
                prev_history = json.load(f)
                initial_epoch = len(prev_history['accuracy'])
                print(f"✅ Resuming from epoch {initial_epoch}")
        else:
            print("✅ Checkpoint loaded (epoch unknown)")
            
    except Exception as e:
        print(f"⚠️ Checkpoint load failed: {e}")
        print("Starting from scratch...")
else:
    print("📝 No checkpoint found. Training from scratch...")

# ============================================
# TRAIN MODEL
# ============================================

print(f"\n🚀 Starting training from epoch {initial_epoch}")
print(f"💾 Checkpoints saving to: {checkpoint_dir}")

history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=20,
    initial_epoch=initial_epoch,
    callbacks=callbacks,
    verbose=1
)

# Save training history
import json
with open(history_path, 'w') as f:
    json.dump(history.history, f)

print(f"\n✅ Training complete!")
print(f"📊 Best model saved at: {best_model_path}")
```

## After Disconnection - How to Resume

1. **Reconnect to Colab**
2. **Re-run all cells EXCEPT:**
   - Skip the cell that downloads Food-101 dataset (if already downloaded to Drive)
   - The training will automatically detect the checkpoint
3. **Training resumes from last saved epoch!**

## Pro Tips 💡

### 1. Save Dataset to Drive (One-time)

```python
# Download dataset to Google Drive instead of /content
dataset_dir = '/content/drive/MyDrive/food-101'

if not os.path.exists(dataset_dir):
    print("Downloading dataset...")
    # Download and extract
else:
    print("✅ Dataset already in Drive, skipping download")
```

### 2. Enable Colab Pro Features (Optional)

- **Colab Pro**: $10/month
  - Longer runtimes (24 hours)
  - Better GPUs (V100/A100)
  - Priority access
  
- **Colab Pro+**: $50/month
  - Background execution
  - Even longer runtimes

### 3. Use Kaggle Instead (Free Alternative)

Kaggle offers:
- 30 hours/week GPU quota
- No disconnections during training
- Persistent datasets

See [`KAGGLE_TRAINING_GUIDE.md`](./KAGGLE_TRAINING_GUIDE.md) for setup.

### 4. Monitor Training Remotely

Add this cell to get email notifications:

```python
# Send email when training completes or fails
def send_notification(status, message):
    # Use a service like SendGrid, or Colab's built-in notifications
    from IPython.display import Javascript
    display(Javascript('''
        google.colab.kernel.proxyPort(8888)
        new Notification("Training {}", {{body: "{}"}});
    '''.format(status, message)))

# After training
send_notification("Complete", "Model training finished!")
```

## Troubleshooting

### Checkpoint file corrupted?
```python
# Delete corrupted checkpoint and start over
os.remove(checkpoint_path)
```

### Out of Drive storage?
```python
# Check Drive usage
!du -sh /content/drive/MyDrive/gymie_checkpoints
```

### Want to start completely fresh?
```python
# Delete all checkpoints
import shutil
if os.path.exists(checkpoint_dir):
    shutil.rmtree(checkpoint_dir)
    print("✅ All checkpoints deleted")
```

## Expected Files After Training

```
/content/drive/MyDrive/gymie_checkpoints/
├── food_classifier_checkpoint.h5       # Last epoch checkpoint
├── food_classifier_best.h5             # Best performing model
└── training_history.json               # Training metrics
```

## What Happens During Training

- **Every epoch**: Saves checkpoint (overwrites previous)
- **Best accuracy**: Saves separate "best" model
- **5 epochs no improvement**: Stops training early
- **Learning stagnates**: Reduces learning rate
- **Disconnection**: Resume from last saved epoch!

Now you can train without fear of disconnections! 🎉
