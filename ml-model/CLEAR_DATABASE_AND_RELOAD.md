
# Clear Database and Reload - Fix for 29 Dishes Issue

## Problem

Your app is only showing 29 dishes instead of 2,001 because the old database is cached. The comprehensive nutrition data (2,001 foods) is in the app's assets but hasn't been loaded yet.

## Solution

You need to **clear the app's data** to force the database to reload with all 2,001 foods.

### Option 1: Clear App Data (Quick - Recommended)

```bash
# Clear all app data (this will reset the database)
adb shell pm clear com.anonymous.Gymie

# Then restart the app
npm run android
```

This will:
- Delete the old database (29 foods)
- Force the app to recreate the database on next launch
- Load all 2,001 foods from `comprehensive_nutrition.json`

### Option 2: Uninstall and Reinstall (Clean)

```bash
# Uninstall the app completely
adb uninstall com.anonymous.Gymie

# Rebuild and install
npm run android
```

This ensures a completely fresh install with all 2,001 foods.

### Option 3: Manual Database Delete (Advanced)

```bash
# Connect to device shell
adb shell

# Navigate to app data
cd /data/data/com.anonymous.Gymie/databases

# Delete the database
rm nutrition.db nutrition.db-wal nutrition.db-shm

# Exit shell
exit

# Restart app
adb shell am force-stop com.anonymous.Gymie
adb shell am start -n com.anonymous.Gymie/.MainActivity
```

## Verification

After clearing and restarting, you should see in the logs:

```
[NutritionDB] Seeding comprehensive nutrition data...
[NutritionDB] Loaded 2001 dishes from comprehensive database
[NutritionDB] Progress: 50/2001 dishes inserted
[NutritionDB] Progress: 100/2001 dishes inserted
...
[NutritionDB] Successfully seeded 2001 dishes
```

You can verify by checking the "Loaded dishes" count in the app logs.

## Why This Happened

1. **First Launch**: App created database with 29 sample dishes
2. **Code Updated**: Added comprehensive nutrition (2,001 foods)
3. **Database Cached**: SQLite keeps the old data until explicitly cleared
4. **Solution**: Clear app data to trigger reload

## Changes Made to Fix This

### 1. Database Version Bump ✅
```typescript
// frontend/src/services/NutritionDatabaseService.ts
private readonly DB_VERSION = '2.0.0'; // Updated from 1.0.0
```

### 2. ID Normalization ✅
```typescript
// frontend/src/services/OfflineNutritionService.ts
const normalizedDishId = prediction.dishId.toUpperCase().replace(/\s+/g, '_');
```

This fixes the "sushi" → "SUSHI" matching issue.

### 3. Lowered Confidence Threshold ✅
```typescript
// frontend/src/hooks/nutrition/useOfflineNutrition.ts
if (result.prediction.confidence >= 0.8) {
  // High confidence
} else if (result.prediction.confidence >= 0.5) {
  // Medium confidence - AUTO-POPULATE ✅
} else {
  // Low confidence
}
```

Now **50%+ confidence** will auto-populate nutrition data instead of requiring manual selection.

## Expected Behavior After Fix

### Sushi (90% confidence) ✅
```
✅ "Food Recognized!"
Detected: Sushi
Confidence: 90%

[Nutrition data auto-populated]
[Ready to log meal]
```

### Cheeseburger (52% confidence) ✅
```
✅ "Food Detected"
Detected: Cheeseburger
Confidence: 52%

Nutrition data populated. Please verify if needed.

[Nutrition data auto-populated]
[User can accept or adjust]
```

### Low Confidence (<50%)
```
⚠️ "Low Confidence Detection"
Detected: [Food Name]
Confidence: 35%

Please verify or search for the correct dish.

[Nutrition data shown but user should verify]
```

## Quick Test

After clearing database and rebuilding:

1. **Take photo of pizza**
   - Expected: Recognizes, shows nutrition (auto-populated)

2. **Take photo of burger**
   - Expected: Recognizes, shows nutrition (auto-populated)

3. **Take photo of sushi**
   - Expected: Recognizes with high confidence, shows nutrition

4. **Check offline food list**
   - Expected: Shows 2,001 foods available

## Summary

**What you need to do:**

```bash
# Run this command:
adb shell pm clear com.anonymous.Gymie

# Then rebuild:
npm run android
```

**What will happen:**
- Database cleared (old 29 foods deleted)
- App loads comprehensive data (2,001 foods)
- High/medium confidence (>50%) auto-populates
- Sushi (90%), Cheeseburger (52%) will work perfectly!

---

**Status**: Ready to fix
**Command**: `adb shell pm clear com.anonymous.Gymie && npm run android`
