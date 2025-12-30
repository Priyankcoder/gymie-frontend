
# 🔴 Colab Disconnected? - Recovery in 7 Steps

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  RUNTIME DISCONNECTED                                    │
│  Your training was interrupted, but DON'T WORRY!            │
│  Your progress is saved in Google Drive                     │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Click "Reconnect" (top-right corner)              │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Run Cell #1 - GPU Setup                           │
│  (Installs TensorFlow, enables mixed precision)            │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Run Cell #2 - Mount Google Drive                  │
│  (Connects to your saved checkpoints)                      │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 4: SKIP Cell #3 - Dataset Download                   │
│  (Already downloaded to /content/food-101)                 │
│  ⚠️ Only re-run if dataset was deleted                     │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Run Cell #4 - Category Selection                  │
│  (Loads the 101 dish categories)                           │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Run Cell #5 - Data Generators                     │
│  (Creates training and validation data pipelines)          │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Run Cell #6 - Model Building                      │
│  (Builds MobileNetV3 architecture)                         │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Run Cell #7 or #8 - Training                     │
│  (Automatically detects and loads checkpoint!)             │
│                                                             │
│  You'll see:                                               │
│  🔄 Found checkpoint: .../phase1_checkpoint.keras          │
│  ✅ Checkpoint loaded successfully!                         │
│  📊 Resuming from epoch 8                                   │
│  🚀 Phase 1: Training classifier head                      │
│  🔢 Starting from epoch: 8                                  │
└─────────────────────────────────────────────────────────────┘

                          ↓

┌─────────────────────────────────────────────────────────────┐
│  ✅ TRAINING RESUMED!                                        │
│  Your model continues training from where it left off      │
│  No progress lost!                                         │
└─────────────────────────────────────────────────────────────┘
```

## What Happens Automatically?

When you re-run the training cell (Step 7 or 8), the code automatically:

1. **Checks** if a checkpoint exists in Google Drive
2. **Loads** the saved model from the checkpoint
3. **Reads** the training history to determine the last epoch
4. **Resumes** training from that epoch
5. **Continues** saving checkpoints after each new epoch

## Example Console Output

```python
🔄 Found checkpoint: /content/drive/MyDrive/gymie_checkpoints/phase1_checkpoint.keras
✅ Checkpoint loaded successfully!
📊 Resuming from epoch 8

============================================================
🚀 Phase 1: Training classifier head
📁 Checkpoints saving to: /content/drive/MyDrive/gymie_checkpoints
🔢 Starting from epoch: 8
🎯 Target epochs: 15
💡 Training will auto-save after each epoch!
============================================================

Epoch 9/15
2525/2525 [==============================] - 245s 97ms/step - loss: 2.1234 - accuracy: 0.4567 - val_loss: 2.3456 - val_accuracy: 0.4123
Epoch 10/15
...
```

## Quick Troubleshooting

### Dataset Deleted?
If you see "food-101 directory not found", re-run Cell #3 to download the dataset again (~10 minutes).

### Checkpoint Corrupted?
Very rare, but if you see errors loading the checkpoint:
```python
# Add this cell before training to delete corrupted checkpoint
import os
checkpoint_path = '/content/drive/MyDrive/gymie_checkpoints/phase1_checkpoint.keras'
if os.path.exists(checkpoint_path):
    os.remove(checkpoint_path)
    print("Checkpoint deleted, will start fresh")
```

### Want to Start Completely Fresh?
```python
# Delete all checkpoints and start over
import shutil
checkpoint_dir = '/content/drive/MyDrive/gymie_checkpoints'
if os.path.exists(checkpoint_dir):
    shutil.rmtree(checkpoint_dir)
    print("All checkpoints deleted")
```

## Tips to Avoid Disconnections

1. **Keep tab active** - Don't minimize or close the Colab tab
2. **Interact occasionally** - Click in the notebook every hour
3. **Use Colab Pro** - $10/month for 24-hour runtimes
4. **Use Kaggle** - Alternative with 30 hours/week GPU quota
5. **Train in phases** - Complete Phase 1, download, then do Phase 2

## Need More Help?

- See [`COLAB_CHECKPOINT_GUIDE.md`](./COLAB_CHECKPOINT_GUIDE.md) for detailed checkpoint documentation
- See [`FREE_MODEL_TRAINING_GUIDE.md`](./FREE_MODEL_TRAINING_GUIDE.md) for complete training guide
- Check [`food_classifier_training.ipynb`](./food_classifier_training.ipynb) - Step 2 has recovery instructions

---

**Remember:** Your progress is ALWAYS saved to Google Drive after every epoch. You can disconnect and reconnect as many times as needed!
