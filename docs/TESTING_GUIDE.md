
# UI Testing Guide

Complete guide to testing the Gymie frontend with both mock and real API.

## 🚀 Quick Start

### Currently Running:
- ✅ **Backend**: http://localhost:8080 (running)
- ⏳ **Frontend**: Starting up...

Once you see "Metro waiting on exp://..." in the terminal, you can access the app!

## 📱 Testing Options

### Option 1: Test with Mock Data (Recommended for UI Development)

**Current Setup:** Mock is enabled by default (`USE_MOCK: true`)

**Pros:**
- ✅ No backend required
- ✅ Instant data
- ✅ Works offline
- ✅ Fast development

**How to Test:**
1. Wait for Metro bundler to start
2. Press `i` for iOS Simulator
3. Press `a` for Android Emulator  
4. Press `w` for Web Browser
5. Scan QR code with Expo Go app (physical device)

**What Works:**
- Create/view/edit workouts
- Log nutrition
- Track progress
- All features work with mock data stored in AsyncStorage

### Option 2: Test with Real API

**Switch to Real API:**
1. Open `frontend/src/config/api.ts`
2. Change `USE_MOCK: false`
3. Press `r` in Metro to reload
4. Or restart with `npm start -- --clear`

**Pros:**
- ✅ Real database persistence
- ✅ Test actual API
- ✅ Verify backend integration
- ✅ Test error handling

**Requirements:**
- Backend must be running on port 8080
- PostgreSQL and Redis must be running
- Network connection to backend

## 🎯 Testing Scenarios

### Scenario 1: UI-Only Development

**Setup:** `USE_MOCK: true`

**Test Flow:**
1. Start frontend: `npm start`
2. Open in iOS/Android
3. Create a workout
4. Add exercises and sets
5. View workout list
6. Check statistics

**Expected:** All data works instantly, no network delays

### Scenario 2: Backend Integration Testing

**Setup:** `USE_MOCK: false`

**Test Flow:**
1. Verify backend is running: `curl http://localhost:8080/health`
2. Start frontend: `npm start -- --clear`
3. Register a new user
4. Create a workout
5. Close app completely
6. Reopen app
7. Login with same credentials
8. Verify workout is still there

**Expected:** Data persists in PostgreSQL database

### Scenario 3: Error Handling

**Setup:** `USE_MOCK: false`

**Test Flow:**
1. Stop backend server (Ctrl+C)
2. Try to create a workout
3. Observe error message
4. Restart backend
5. Try again

**Expected:** App shows appropriate error messages

## 📋 Testing Checklist

### Authentication Tests
- [ ] Register new user (with mock)
- [ ] Login existing user (with mock)
- [ ] Register new user (with real API)
- [ ] Login existing user (with real API)
- [ ] Invalid credentials show error
- [ ] Token persists after app restart

### Workout Tests
- [ ] Create workout with exercises
- [ ] Add multiple sets to exercise
- [ ] Mark sets as completed
- [ ] View workout list
- [ ] Edit existing workout
- [ ] Delete workout
- [ ] View workout statistics
- [ ] Filter workouts by date

### Nutrition Tests
- [ ] Log food for a meal
- [ ] Add multiple meals per day
- [ ] View nutrition by date
- [ ] See calorie/macro totals
- [ ] Edit meal
- [ ] Delete meal
- [ ] View nutrition statistics

### Progress Tests
- [ ] Add weight entry
- [ ] View weight history
- [ ] See weight progress chart
- [ ] Add progress photo
- [ ] View photo gallery
- [ ] Delete entries

### UI/UX Tests
- [ ] Navigation works smoothly
- [ ] Forms validate input
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success messages display
- [ ] Dark mode (if implemented)
- [ ] Responsive design

## 🔧 Metro Bundler Commands

Once Metro starts, you can use these commands:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web browser

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

## 📱 Testing on Different Platforms

### iOS Simulator
```bash
# In Metro terminal, press 'i'
# Or manually:
npm run ios
```

### Android Emulator
```bash
# In Metro terminal, press 'a'
# Or manually:
npm run android
```

### Web Browser
```bash
# In Metro terminal, press 'w'
# Or manually:
npm run web
```

### Physical Device (Expo Go)
1. Install Expo Go from App Store/Play Store
2. Scan QR code shown in terminal
3. App loads on your device

**For Real API on Physical Device:**
```bash
# Find your computer's IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env
EXPO_PUBLIC_API_URL=http://YOUR_IP:8080/v1

# Restart Metro
npm start -- --clear
```

## 🐛 Debugging

### Enable React Native Debugger
1. Press `j` in Metro terminal
2. Opens Chrome DevTools
3. View console logs
4. Inspect network requests

### View API Requests
```typescript
// In realApi.ts, requests are logged
// Check Metro bundler terminal for:
console.log('API Request:', method, url, data);
console.log('API Response:', response);
```

### Check Backend Logs
```bash
# Backend terminal shows all incoming requests
2025/12/18 03:25:24 [POST] /v1/auth/register ::1 201 223.500666ms
2025/12/18 03:25:24 [POST] /v1/workouts ::1 201 27.372916ms
```

### Common Issues

**Issue: "Network Error" with Real API**
```bash
# Check backend is running
curl http://localhost:8080/health

# For Android, use 10.0.2.2 instead of localhost
# Update .env:
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/v1
```

**Issue: "Metro bundler stuck"**
```bash
# Clear cache and restart
npm start -- --clear
```

**Issue: "Changes not reflecting"**
```bash
# Press 'r' in Metro to reload
# Or shake device and press "Reload"
```

## 🎨 Testing UI Components

### Test Dark/Light Theme
```bash
# On iOS: Settings > Developer Menu > Toggle Theme
# On Android: Shake device > Toggle Theme
```

### Test Different Screen Sizes
```bash
# iOS Simulator: Hardware > Device
# Android Emulator: AVD Manager > Edit Device
```

### Test Network Conditions
```bash
# Chrome DevTools > Network tab
# Throttle to "Slow 3G" to test loading states
```

## 📊 Performance Testing

### Check Bundle Size
```bash
npx expo export --platform ios
# Check .expo/dist folder for bundle size
```

### Monitor Memory Usage
```bash
# iOS: Xcode > Debug > View Memory
# Android: Android Studio > Profiler
```

### Test Render Performance
```bash
# Enable React DevTools Profiler
# Record user interactions
# Analyze render times
```

## ✅ Testing Workflow

### Daily Development
1. Use mock API (`USE_MOCK: true`)
2. Focus on UI/UX
3. Iterate quickly
4. No backend needed

### Integration Testing (End of Day)
1. Switch to real API (`USE_MOCK: false`)
2. Verify all features work
3. Test error scenarios
4. Check data persistence

### Pre-Deployment
1. Test with real API
2. Test on all platforms
3. Test on physical devices
4. Test different network conditions
5. Test error scenarios
6. Performance testing

## 🚀 Quick Test Commands

```bash
# Start with mock API (default)
npm start

# Start with cleared cache
npm start -- --clear

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build for production
npx expo build:ios
npx expo build:android
```

## 📝 Test Scenarios by Feature

### Complete User Flow Test
1. **Register**: Create new account
2. **Profile**: Set height, weight, goal
3. **Workout**: Log a workout with 3 exercises
4. **Nutrition**: Log 3 meals for today
5. **Progress**: Add weight entry
6. **Stats**: Check all statistics pages
7. **Logout**: Logout and login again
8. **Verify**: All data persists

### Expected Time: ~5 minutes

## 🎯 Current Testing Status

**Right Now:**
- ✅ Backend: Running and healthy
- ⏳ Frontend: Starting up
- ✅ Mock API: Ready
- ✅ Real API: Ready

**Once Metro starts, you can:**
1. Press `i` for iOS (fastest)
2. Press `w` for web (easiest)
3. Scan QR for physical device

**Recommended First Test:**
1. Start with iOS Simulator (press `i`)
2. Test with mock data first
3. Then switch to real API
4. Compare the experience

## 📞 Need Help?

- Frontend logs: Metro bundler terminal
- Backend logs: Backend terminal (already running)
- API requests: Network tab in React Native Debugger
- Database: `docker exec -it gymie-postgres psql -U postgres -d gymie_dev`

Happy Testing! 🎉
