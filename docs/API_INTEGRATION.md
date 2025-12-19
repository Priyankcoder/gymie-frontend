
# API Integration Guide

This guide explains how to switch between mock and real API in the Gymie frontend.

## Quick Start

### Using Mock API (Default for Development)

The app comes with mock data pre-configured. No backend needed!

```typescript
// In src/config/api.ts
export const API_CONFIG = {
  USE_MOCK: true,  // Use mock data
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/v1',
  TIMEOUT: 30000,
};
```

### Using Real API

1. **Start the backend server** (see `../../backend/README.md`)

2. **Update API configuration**:
   ```typescript
   // In src/config/api.ts
   export const API_CONFIG = {
     USE_MOCK: false,  // Use real API
     BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/v1',
     TIMEOUT: 30000,
   };
   ```

3. **Configure environment variables**:
   ```bash
   # In frontend/.env
   EXPO_PUBLIC_API_URL=http://localhost:8080/v1
   ```

4. **Restart the app**:
   ```bash
   npm start -- --clear
   ```

## Feature Flag System

The app uses a feature flag (`USE_MOCK`) to switch between mock and real API:

```typescript
// src/services/api.ts
export const api = {
  auth: API_CONFIG.USE_MOCK ? {
    // Mock implementation
    register: localApi.register,
    login: localApi.login,
    // ...
  } : {
    // Real API implementation
    register: realApi.authApi.register,
    login: realApi.authApi.login,
    // ...
  },
};
```

## API Services Architecture

```
src/
├── config/
│   └── api.ts                 # API configuration & endpoints
├── services/
│   ├── api.ts                 # Unified API (uses feature flag)
│   ├── localApi.ts            # Mock implementation
│   ├── realApi.ts             # Real API implementation
│   ├── apiClient.ts           # Axios client with interceptors
│   └── authStorage.ts         # Token & user data storage
```

## Authentication Flow

### Mock API
- Stores data in AsyncStorage
- Simulates JWT tokens
- No actual server communication

### Real API
1. User logs in/registers
2. Backend returns JWT token
3. Token stored in AsyncStorage
4. Token automatically added to all requests via axios interceptor
5. On 401 error, token cleared and user logged out

## API Endpoints

All endpoints are defined in `src/config/api.ts`:

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Workouts
- `GET /workouts` - List all workouts
- `POST /workouts` - Create workout
- `GET /workouts/:id` - Get workout details
- `PUT /workouts/:id` - Update workout
- `DELETE /workouts/:id` - Delete workout
- `GET /workouts/stats` - Get workout statistics

### Nutrition
- `GET /nutrition` - List nutrition days
- `POST /nutrition` - Create nutrition day
- `GET /nutrition/:id` - Get nutrition day
- `GET /nutrition/date?date=YYYY-MM-DD` - Get by date
- `GET /nutrition/range?start_date&end_date` - Get by range
- `PUT /nutrition/:id` - Update nutrition day
- `DELETE /nutrition/:id` - Delete nutrition day
- `GET /nutrition/stats` - Get nutrition statistics

### Progress
- `GET /progress/photos` - List progress photos
- `POST /progress/photos` - Create progress photo
- `PUT /progress/photos/:id` - Update photo
- `DELETE /progress/photos/:id` - Delete photo
- `GET /progress/weight` - List weight entries
- `POST /progress/weight` - Create weight entry
- `PUT /progress/weight/:id` - Update entry
- `DELETE /progress/weight/:id` - Delete entry
- `GET /progress/weight/stats` - Get weight progress

## Error Handling

The `apiClient.ts` includes automatic error handling:

```typescript
// Intercepts all errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Auto logout on unauthorized
      await clearStoredToken();
    }
    return Promise.reject(error);
  }
);
```

## Network Configuration

### iOS Simulator
```typescript
EXPO_PUBLIC_API_URL=http://localhost:8080/v1
```

### Android Emulator
```typescript
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/v1
```

### Physical Device
```typescript
// Find your computer's IP address
// macOS: ifconfig | grep "inet " | grep -v 127.0.0.1
// Windows: ipconfig

EXPO_PUBLIC_API_URL=http://192.168.1.X:8080/v1
```

## Testing the Integration

### 1. Test Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "version": "1.0.0"
  }
}
```

### 2. Test Registration in App

1. Set `USE_MOCK: false` in `src/config/api.ts`
2. Start the backend: `cd backend && go run cmd/api/main.go`
3. Start the app: `npm start`
4. Register a new user
5. Check backend logs for the request

### 3. Verify Data Persistence

1. Create a workout in the app
2. Restart the app
3. Workout should still be there (stored in database)

## Switching Between Mock and Real API

### Development Workflow

**Scenario 1: UI Development (No Backend Needed)**
```typescript
USE_MOCK: true
```
- Fast development
- No backend required
- Instant data
- No network delays

**Scenario 2: Integration Testing**
```typescript
USE_MOCK: false
```
- Test real API endpoints
- Verify data persistence
- Test error handling
- Check network behavior

**Scenario 3: Production**
```typescript
USE_MOCK: false
EXPO_PUBLIC_API_URL=https://api.yourapp.com/v1
```

## Common Issues

### Issue: "Network Error"

**Solution:**
1. Check if backend is running: `curl http://localhost:8080/health`
2. Check API URL in `.env`
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For physical device, use your computer's IP address

### Issue: "401 Unauthorized"

**Solution:**
1. Token might be expired
2. Clear app data and login again
3. Check JWT_SECRET in backend `.env`

### Issue: Data not persisting

**Solution:**
1. Verify `USE_MOCK: false`
2. Check backend database connection
3. Check backend logs for errors

### Issue: Slow API responses

**Solution:**
1. Enable Redis caching in backend
2. Check network connection
3. Add request timeouts
4. Optimize database queries

## API Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human readable error message",
  "details": { /* optional error details */ }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

## Migration Checklist

When moving from mock to real API:

- [ ] Backend server is running
- [ ] Database is set up and migrated
- [ ] Redis is running
- [ ] Environment variables configured
- [ ] `USE_MOCK: false` in api.ts
- [ ] Correct API_URL for your environment
- [ ] Test authentication flow
- [ ] Test data CRUD operations
- [ ] Test error scenarios
- [ ] Test offline behavior
- [ ] Verify data persistence

## Performance Tips

1. **Enable Caching**: Backend uses Redis for frequently accessed data
2. **Batch Requests**: Use pagination to limit data
3. **Optimize Images**: Compress before uploading
4. **Handle Offline**: Implement offline-first with local storage
5. **Add Loading States**: Better UX during API calls

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS for API
2. **Token Storage**: Tokens stored securely in AsyncStorage
3. **Token Expiration**: Automatic logout on 401
4. **Input Validation**: Both client and server validate data
5. **Rate Limiting**: Backend has rate limiting enabled

## Next Steps

1. ✅ Mock API working
2. ✅ Real API integrated
3. 🔄 Test all endpoints
4. 📱 Test on physical device
5. 🚀 Deploy to production

## Support

- **Backend Docs**: `../../backend/docs/`
- **API Contract**: `../../docs/API_CONTRACT.md`
- **Backend Setup**: `../../backend/SETUP.md`

---

**Remember**: Always test with real API before deploying to production!
