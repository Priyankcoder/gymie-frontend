
# 🔐 Authentication Setup Guide

## ⚠️ Important: Authentication Required!

The error "Authorization header is required" means your backend IS working correctly and enforcing authentication!

In **REAL mode** (USE_MOCK: false), all endpoints except `/auth/register` and `/auth/login` require a JWT token.

## 🎯 Solution: Login or Register First

### Option 1: Use the App UI (Recommended)

Your app should have a login/registration screen. Use it to:

1. **Register a new account:**
   - Email: `test@example.com`
   - Password: `password123` (or any password you choose)
   - Name: `Test User`

2. **Or Login** if you already have an account

Once logged in, the JWT token will be stored and automatically included in all requests.

### Option 2: Quick Backend Test (Command Line)

Test authentication is working:

```bash
cd frontend
node test-auth-flow.js
```

This will:
- ✅ Register a new user
- ✅ Get user info (with token)
- ✅ Get profile (with token)
- ✅ Login again

And you'll see the backend logs!

### Option 3: Manual cURL Test

```bash
# 1. Register
curl -X POST http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Response will include a token:
# {"success":true,"data":{"token":"eyJhbG...", "user":{...}}}

# 2. Copy the token and use it:
TOKEN="<paste-token-here>"

# 3. Now you can call protected endpoints:
curl http://localhost:8080/v1/workouts \
  -H "Authorization: Bearer $TOKEN"
```

## 🔍 How Authentication Works

### Mock Mode (`USE_MOCK: true`)
```typescript
// No authentication needed
api.workouts.getAll()  // ✅ Works immediately
```

### Real Mode (`USE_MOCK: false`)
```typescript
// 1. First, login/register
await api.auth.register(email, password, name)
// OR
await api.auth.login(email, password)

// This stores the JWT token automatically

// 2. Then, all API calls work
await api.workouts.getAll()  // ✅ Now works with token
```

## 🛠️ Token Storage

The JWT token is automatically:
- **Stored** after successful login/register
- **Sent** with every API request via axios interceptor
- **Cleared** on logout or 401 errors

Check your token storage implementation in:
- [`frontend/src/services/authStorage.ts`](frontend/src/services/authStorage.ts)
- [`frontend/src/services/apiClient.ts`](frontend/src/services/apiClient.ts) (lines 16-27)

## 🧪 Testing the Full Flow

### Test Script

Create this test file:

```bash
cat > frontend/test-authenticated-workout.js << 'EOF'
const axios = require('axios');

const API = 'http://localhost:8080/v1';

async function testWorkoutFlow() {
  try {
    console.log('1. Registering user...');
    const registerRes = await axios.post(`${API}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    });
    
    const token = registerRes.data.data.token;
    console.log('✓ Got token:', token.substring(0, 30) + '...');
    
    console.log('\n2. Fetching workouts with token...');
    const workoutsRes = await axios.get(`${API}/workouts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Workouts:', workoutsRes.data);
    
    console.log('\n3. Creating a workout...');
    const createRes = await axios.post(`${API}/workouts`, {
      date: new Date().toISOString().split('T')[0],
      name: 'Test Workout',
      duration: 60,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { reps: 10, weight: 60, completed: true }
          ]
        }
      ],
      notes: 'Test workout from API',
      completed: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Created workout:', createRes.data);
    
    console.log('\n✅ All tests passed! Check backend terminal for logs.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWorkoutFlow();
EOF

node test-authenticated-workout.js
```

## 📋 Troubleshooting

### Error: "Authorization header is required"
**Solution:** Login or register first to get a token

### Error: "Token expired" or "Invalid token"
**Solution:** Login again to get a fresh token

### Error: "Email already exists"
**Solution:** Use a different email or login with existing credentials

### Token not being sent
**Check:**
1. Token is stored: Check AsyncStorage or localStorage
2. Interceptor is working: Check [`apiClient.ts`](frontend/src/services/apiClient.ts:16-27)
3. Token format: Should be `Bearer <token>` in Authorization header

## 🎯 Quick Checklist

- [ ] Backend running: `cd backend && make run`
- [ ] Frontend running: `cd frontend && npm start`
- [ ] Console shows: `API Mode: REAL`
- [ ] Register/Login in the app
- [ ] Try accessing features (workouts, nutrition, etc.)
- [ ] Check backend logs for authenticated requests

## 💡 Development Tip

For development/testing, you might want to:

1. **Use a test account:**
   ```
   Email: dev@test.com
   Password: testpass123
   ```

2. **Keep the token logged** in console for debugging

3. **Clear storage** if you get token errors:
   ```javascript
   // In browser console or React Native debugger
   localStorage.clear()  // Web
   // or
   AsyncStorage.clear()  // React Native
   ```

## ✨ Summary

The "Authorization header required" error is **good news** - it means:
- ✅ Backend is running
- ✅ Backend is receiving requests
- ✅ Backend is protecting endpoints correctly

You just need to **login/register** in your app, and then everything will work!
