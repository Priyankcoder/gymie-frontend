
# Hybrid Photo Storage System

## Overview

The Gymie app uses a **hybrid approach** for storing progress photos:
- **Local Storage**: Photos are stored in the app's document directory for offline access
- **Cloud Sync**: Photos are automatically synced to the backend when online
- **Smart Download**: Photos from other devices are downloaded on-demand

## Architecture

```
┌─────────────────┐
│   User Device   │
│                 │
│  1. Take Photo  │
│  2. Save Local  │
│  3. Queue Sync  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Internet     ┌──────────────┐
│ Photo Sync Svc  │◄───available────►│   Backend    │
│                 │                   │  API Server  │
│  - Queue mgmt   │                   │              │
│  - Auto retry   │                   │  - Storage   │
│  - Download     │                   │  - CDN URLs  │
└─────────────────┘                   └──────────────┘
```

## Key Features

### ✅ **Offline-First**
- Photos work immediately without internet
- Changes are queued and synced later
- No data loss if offline

### ☁️ **Automatic Sync**
- Uploads happen in background
- Auto-retry on failure
- Network status detection

### 📱 **Multi-Device Support**
- Photos sync across devices
- Download on-demand from cloud
- Local cache management

### 🔒 **Data Persistence**
- Local files in app directory
- Survives app restarts
- Metadata in AsyncStorage

## How It Works

### 1. Taking/Picking a Photo

```typescript
// User takes or picks photo
const result = await ImagePicker.launchCameraAsync();

// 1. Save to local file system
const localUri = await photoSyncService.savePhotoLocally(
  result.uri,
  photoId
);

// 2. Store metadata in AsyncStorage
await api.photos.create({
  id: photoId,
  uri: localUri,
  date: new Date().toISOString()
});

// 3. Upload to cloud (background)
photoSyncService.uploadPhoto(photo);
```

### 2. Sync Queue

Photos pending upload are tracked:
```typescript
{
  pending: ["photo-id-1", "photo-id-2"],
  failed: ["photo-id-3"] // Will retry
}
```

### 3. Network Detection

```typescript
// Auto-sync when network becomes available
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    photoSyncService.syncPendingPhotos();
  }
});
```

### 4. Download from Cloud

```typescript
// When viewing photos from another device
const localUri = await photoSyncService.downloadPhoto(
  cloudUrl,
  photoId
);
```

## Backend Integration Required

### API Endpoints Needed

#### 1. Upload Photo
```http
POST /api/v1/progress/photos
Content-Type: multipart/form-data

photo: <file>
date: "2024-12-26T09:00:00.000Z"
notes: "Post-workout"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "photo-uuid",
    "url": "https://cdn.example.com/photos/photo-uuid.jpg",
    "thumbnailUrl": "https://cdn.example.com/photos/thumb-photo-uuid.jpg",
    "uploadedAt": "2024-12-26T09:00:00.000Z"
  }
}
```

#### 2. Delete Photo
```http
DELETE /api/v1/progress/photos/:photoId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

#### 3. Get All Photos (Optional - for sync)
```http
GET /api/v1/progress/photos
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "photo-uuid",
      "url": "https://cdn.example.com/photos/photo-uuid.jpg",
      "date": "2024-12-26T09:00:00.000Z",
      "notes": "Post-workout"
    }
  ]
}
```

### Backend Implementation Tips

1. **Cloud Storage**
   - Use AWS S3, Google Cloud Storage, or Cloudinary
   - Generate signed URLs for security
   - Store thumbnails for faster loading

2. **Security**
   - Validate file types (only images)
   - Limit file size (e.g., 10MB max)
   - Scan for malware
   - Use authentication tokens

3. **Optimization**
   - Compress images on upload
   - Generate thumbnails
   - Use CDN for fast delivery
   - Cache-Control headers

## File Structure

```
progress_photos/
├── 1703593200000.jpg  (Local files)
├── 1703593300000.jpg
└── 1703593400000.jpg

AsyncStorage:
├── @gymie_progress_photos     (Photo metadata)
└── @gymie_photo_sync_queue    (Sync queue)
```

## Storage Locations

### Local Storage
- **Directory**: `${FileSystem.documentDirectory}progress_photos/`
- **Persists**: Until app is uninstalled
- **Access**: Offline available

### Cloud Storage
- **Location**: Backend server (S3/GCS/etc.)
- **Persists**: Permanently (or until deleted)
- **Access**: Requires internet

## Configuration

Update the backend URL in `photoSyncService.ts`:

```typescript
const BACKEND_URL = 'https://your-api.com/api/v1';
```

Add authentication headers:

```typescript
headers: {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'multipart/form-data',
}
```

## Usage

### Initialize Service
```typescript
import { photoSyncService } from './services/photoSyncService';

// In app initialization
await photoSyncService.initialize();
```

### Check Sync Status
```typescript
const status = photoSyncService.getSyncStatus();
console.log(`Pending: ${status.pending}, Failed: ${status.failed}`);
```

### Manual Sync
```typescript
await photoSyncService.syncPendingPhotos();
```

### Clear Cache
```typescript
// Free up space
await photoSyncService.clearCache();
```

### Get Cache Size
```typescript
const size = await photoSyncService.getCacheSize();
console.log(`Cache: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

## Migration from Old System

If you have photos stored with temporary URIs:

```typescript
async function migratePhotos() {
  const photos = await storage.get('PROGRESS_PHOTOS');
  
  for (const photo of photos) {
    // Copy to app directory
    const localUri = await photoSyncService.savePhotoLocally(
      photo.uri,
      photo.id
    );
    
    // Update metadata
    photo.uri = localUri;
    
    // Queue for upload
    await photoSyncService.uploadPhoto(photo);
  }
}
```

## Troubleshooting

### Photos Not Syncing?
1. Check internet connection
2. View sync queue: `photoSyncService.getSyncStatus()`
3. Check console for upload errors
4. Verify backend endpoint is accessible

### Photos Not Loading?
1. Check if local file exists
2. Try downloading from cloud if available
3. Check file permissions
4. Verify file path format

### Out of Storage?
1. Check cache size: `getCacheSize()`
2. Clear old photos: `clearCache()`
3. Implement auto-cleanup for old photos

## Best Practices

1. **Always save locally first** - Don't wait for upload
2. **Upload in background** - Don't block UI
3. **Handle failures gracefully** - Queue and retry
4. **Show sync status** - Let users know what's happening
5. **Implement cache limits** - Don't fill device storage
6. **Use thumbnails** - For gallery view
7. **Compress before upload** - Save bandwidth

## Security Considerations

1. **Permissions**
   - Request camera/photo library access
   - Handle permission denials gracefully

2. **Data Privacy**
   - Photos are personal, handle with care
   - Allow users to delete from cloud
   - Implement proper auth

3. **Network Security**
   - Use HTTPS for all uploads
   - Validate SSL certificates
   - Don't log sensitive data

## Future Enhancements

- [ ] Batch upload for multiple photos
- [ ] Progress indicators during upload
- [ ] Photo compression before upload
- [ ] Thumbnail generation
- [ ] Photo comparison slider
- [ ] Photo notes/annotations
- [ ] Share photos with trainer
- [ ] Auto-backup to device gallery
- [ ] Facial recognition for progress tracking
