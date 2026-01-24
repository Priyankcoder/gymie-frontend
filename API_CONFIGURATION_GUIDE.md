
# API Configuration Guide - Development & Production

## How It Works

The `frontend/src/config/api.ts` file now **automatically** handles both development and production environments.

## Smart API URL Resolution

### Priority Order:

```
1. EXPO_PUBLIC_API_URL environment variable (if set)
   ↓ (if not set)
2. Production API URL (if release build)
   ↓ (if dev mode)
3. Platform-specific localhost (Android/iOS/Web)
```

## Configuration

### 1. Update Production URL

**Edit this line in `frontend/src/config/api.ts`:**

```typescript
const PRODUCTION_API_URL = 'https://gymie-api.onrender.com/v1';
```

Change to your actual Render backend URL:
```typescript
const PRODUCTION_API_URL = 'https://YOUR-APP-NAME.onrender.com/v1';
```

### 2. How It Detects Environment

**Development Mode (`__DEV__ = true`):**
- Running with `npm start` / `expo start`
- Running in Expo Go
- Running in development builds
- **Uses:** Platform-specific localhost

**Production Mode (`__DEV__ = false`):**
- Built with `eas build`
- Release APK/IPA
- Standalone app
- **Uses:** `PRODUCTION_API_URL`

## Different Environments

### Local Development ✅ (Currently Working)

```bash
# Start Expo
npm start

# Android Emulator
press 'a' → Uses http://10.0.2.2:8080/v1

# iOS Simulator
press 'i' → Uses http://localhost:8080/v1

# Web Browser
press 'w' → Uses http://localhost:8080/v1
```

### Production Build (Android/iOS)

```bash
# Build with EAS
eas build --platform android

# The built APK automatically uses:
# https://gymie-api.onrender.com/v1
```

**No environment variable needed!** It automatically detects it's a release build.

### Manual Override (Optional)

If you want to override the automatic detection:

```bash
# In .env file
EXPO_PUBLIC_API_URL=https://staging-api.example.com/v1

# Or in app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://staging-api.example.com/v1"
    }
  }
}
```

## Testing Production API Locally

### Method 1: Override with Environment Variable

```bash
# Create frontend/.env
EXPO_PUBLIC_API_URL=https://gymie-api.onrender.com/v1

# Start app
npm start
```

### Method 2: Use Release Build Locally

```bash
# Build release version
eas build --profile preview --platform android

# Install on device/emulator
# Will use production API
```

### Method 3: Temporary Code Change

```typescript
// In api.ts, temporarily change:
if (!__DEV__) {  // Change to: if (true) {
  return PRODUCTION_API_URL;
}
```

## Verification

### Check Current API URL

Add this to any component:

```typescript
import { API_CONFIG } from '@/config/api';

console.log('API URL:', API_CONFIG.BASE_URL);
console.log('Is Production:', API_CONFIG.IS_PRODUCTION);
```

### Expected Output:

**Development Mode:**
```
API URL: http://10.0.2.2:8080/v1 (Android)
API URL: http://localhost:8080/v1 (iOS/Web)
Is Production: false
```

**Production Build:**
```
API URL: https://gymie-api.onrender.com/v1
Is Production: true
```

## Platform-Specific Behavior

### Android Emulator
- **Development:** `http://10.0.2.2:8080/v1` (special emulator address)
- **Production:** `https://gymie-api.onrender.com/v1`

### iOS Simulator
- **Development:** `http://localhost:8080/v1`
- **Production:** `https://gymie-api.onrender.com/v1`

### Web Browser
- **Development:** `http://localhost:8080/v1`
- **Production:** `https://gymie-api.onrender.com/v1` (or web-specific URL if needed)

### Real Device (Physical Phone)
- **Development:** Won't work (can't access localhost)
- **Production:** `https://gymie-api.onrender.com/v1` ✅

## Common Issues & Solutions

### Issue 1: "Network Error" in Production Build

**Cause:** Backend URL is wrong or backend is down

**Fix:**
1. Check `PRODUCTION_API_URL` in api.ts
2. Verify backend is running: `curl https://gymie-api.onrender.com/health`
3. Check CORS settings in backend

### Issue 2: Works in Development but not in Production Build

**Cause:** Backend CORS not allowing production domain

**Fix:**
In backend, update `CORS_ALLOWED_ORIGINS`:
```
# Instead of:
CORS_ALLOWED_ORIGINS=*

# Use specific domain:
CORS_ALLOWED_ORIGINS=https://gymie.fit,capacitor://localhost,http://localhost
```

### Issue 3: Android Real Device Can't Connect in Dev Mode

**Cause:** Real devices can't access localhost

**Solution 1:** Use your computer's IP address
```typescript
// Temporary for dev on real device:
const PRODUCTION_API_URL = 'http://192.168.1.100:8080/v1';
```

**Solution 2:** Use ngrok or similar tunnel
```bash
ngrok http 8080
# Use ngrok URL in EXPO_PUBLIC_API_URL
```

### Issue 4: Want Different URLs for Staging/Production

**Solution:** Use EAS build profiles

```json
// eas.json
{
  "build": {
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.example.com/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://gymie-api.onrender.com/v1"
      }
    }
  }
}
```

## Backend CORS Configuration

Your backend needs to allow requests from:

```go
// backend CORS config should include:
CORS_ALLOWED_ORIGINS=https://gymie.fit,http://localhost:8081,capacitor://localhost
```

Or for development, use `*`:
```go
CORS_ALLOWED_ORIGINS=*
```

## Security Considerations

### Development
- ✅ Using localhost is safe (not exposed to internet)
- ✅ Android emulator address is safe (internal only)

### Production
- ✅ HTTPS enforced automatically (Render provides SSL)
- ✅ JWT tokens transmitted securely
- ⚠️ Make sure backend has proper CORS settings
- ⚠️ Don't commit sensitive API keys to git

## Deployment Checklist

**Before building production APK:**

- [ ] Update `PRODUCTION_API_URL` in `api.ts` with actual backend URL
- [ ] Verify backend is deployed and running
- [ ] Test API endpoint: `curl https://your-backend.onrender.com/health`
- [ ] Verify backend CORS allows your domain
- [ ] Build with: `eas build --platform android`
- [ ] Test on real device (not emulator)

## Environment Variables Summary

| Variable | Where | When Needed | Example |
|----------|-------|-------------|---------|
| `PRODUCTION_API_URL` | `api.ts` (hardcoded) | Always | `https://gymie-api.onrender.com/v1` |
| `EXPO_PUBLIC_API_URL` | `.env` or `eas.json` | Optional override | `https://staging-api.com/v1` |
| `__DEV__` | React Native (automatic) | Auto-detected | `true` or `false` |

## Quick Reference

```typescript
// Current smart configuration in api.ts:

const PRODUCTION_API_URL = 'https://gymie-api.onrender.com/v1';

function getDefaultBaseURL() {
  // 1. Check explicit override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // 2. Production build?
  if (!__DEV__) {
    return PRODUCTION_API_URL; // ← Production APK uses this
  }
  
  // 3. Development localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/v1'; // ← Dev Android uses this
  }
  return 'http://localhost:8080/v1';  // ← Dev iOS/Web uses this
}
```

## Summary

✅ **Local Development:** Works perfectly with localhost (different per platform)

✅ **Production Build:** Automatically uses production API URL

✅ **No Manual Changes Needed:** Just update `PRODUCTION_API_URL` once

✅ **Flexible:** Can override with environment variables if needed

**You're all set!** The configuration now handles both local development and production automatically.
