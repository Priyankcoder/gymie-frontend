import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { ProgressPhoto } from "../types";
import { storage } from "./localStorage";
import { getStoredToken } from "./authStorage";
import { API_CONFIG } from "../config/api";

const PHOTOS_DIR = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}progress_photos/`
  : "";
const isWeb = Platform.OS === "web";

// IndexedDB setup for web
const DB_NAME = "GymiePhotos";
const STORE_NAME = "photos";
let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function savePhotoToIndexedDB(
  photoId: string,
  blob: Blob
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id: photoId, blob, timestamp: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPhotoFromIndexedDB(photoId: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(photoId);

    request.onsuccess = () => {
      resolve(request.result?.blob || null);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deletePhotoFromIndexedDB(photoId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(photoId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getIndexedDBSize(): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const totalSize = request.result.reduce(
        (acc, item) => acc + (item.blob?.size || 0),
        0
      );
      resolve(totalSize);
    };
    request.onerror = () => reject(request.error);
  });
}

async function clearIndexedDB(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

interface PhotoSyncQueue {
  pending: string[]; // Photo IDs pending upload
  failed: string[];  // Photo IDs that failed to upload
}

type UnauthorizedHandler = () => void | Promise<void>;

class PhotoSyncService {
  private syncQueue: PhotoSyncQueue = { pending: [], failed: [] };
  private isSyncing = false;
  private unauthorizedHandler: UnauthorizedHandler | null = null;

  /**
   * Register a handler to be called when 401 Unauthorized is received
   */
  setUnauthorizedHandler(handler: UnauthorizedHandler) {
    this.unauthorizedHandler = handler;
  }

  async initialize() {
    if (isWeb) {
      // Initialize IndexedDB for web
      try {
        await getDB();
        console.log("📁 IndexedDB initialized for photo storage");
      } catch (error) {
        console.error("❌ Error initializing IndexedDB:", error);
      }
      return;
    }

    // Ensure photos directory exists on native
    const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
    }

    // Load sync queue
    const queue = await storage.get<PhotoSyncQueue>(
      storage.keys.PHOTO_SYNC_QUEUE
    );
    if (queue) {
      this.syncQueue = queue;
    }

    // Start auto-sync when network is available
    NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingPhotos();
      }
    });
  }

  /**
   * Save photo to local file system or IndexedDB
   */
  async savePhotoLocally(photoUri: string, photoId: string): Promise<string> {
    if (isWeb) {
      // On web, convert URI to Blob and save to IndexedDB
      try {
        const response = await fetch(photoUri);
        const blob = await response.blob();

        // Save to IndexedDB first (ensure it completes)
        await savePhotoToIndexedDB(photoId, blob);
        console.log("✅ Photo saved to IndexedDB:", photoId);

        // Return a blob URL that can be used in <Image> components
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("❌ Error saving photo to IndexedDB:", error);
        return photoUri; // Fallback to original URI
      }
    }

    const fileExtension = photoUri.split(".").pop() || "jpg";
    const localUri = `${PHOTOS_DIR}${photoId}.${fileExtension}`;

    // Copy photo to app's document directory
    await FileSystem.copyAsync({
      from: photoUri,
      to: localUri,
    });

    return localUri;
  }

  /**
   * Upload photo to backend
   */
  async uploadPhoto(
    photo: ProgressPhoto
  ): Promise<{ success: boolean; cloudUrl?: string }> {
    try {
      console.log("🔄 Starting upload for photo:", photo.id);
      
      // Skip NetInfo check on web (browsers handle this differently)
      if (!isWeb) {
        const netInfo = await NetInfo.fetch();
        console.log("📡 Network status:", netInfo.isConnected);
        if (!netInfo.isConnected) {
          console.log("📴 No internet connection, queuing photo for later sync");
          await this.addToSyncQueue(photo.id);
          return { success: false, willRetry: true };
        }
      }

      let photoBlob: Blob;

      if (isWeb) {
        // On web, get blob from IndexedDB (should already be there from savePhotoLocally)
        console.log("📂 Retrieving photo from IndexedDB:", photo.id);
        const cachedBlob = await getPhotoFromIndexedDB(photo.id);
        if (cachedBlob) {
          photoBlob = cachedBlob;
          console.log("✅ Photo found in IndexedDB, size:", cachedBlob.size);
        } else {
          console.error("❌ Photo not found in IndexedDB:", photo.id);
          return { success: false, willRetry: false };
        }
      } else {
        // Check if file exists locally on native
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (!fileInfo.exists) {
          console.error("❌ Photo file not found:", photo.uri);
          return { success: false };
        }
      }

      // Backend endpoint - uses centralized API config
      const BACKEND_URL = API_CONFIG.BASE_URL;
      console.log("🌐 Backend URL:", BACKEND_URL);

      // Create form data for upload
      const formData = new FormData();
      console.log("📦 Creating FormData...");

      if (isWeb) {
        // On web, append the blob directly
        console.log("🌐 Web platform: appending blob to FormData");
        formData.append("photo", photoBlob!, `${photo.id}.jpg`);
      } else {
        // On native, append file URI
        console.log("📱 Native platform: appending file URI to FormData");
        formData.append("photo", {
          uri: photo.uri,
          type: "image/jpeg",
          name: `${photo.id}.jpg`,
        } as any);
      }

      // Ensure date is in RFC3339 format (ISO 8601)
      const dateStr = new Date(photo.date).toISOString();
      formData.append("date", dateStr);
      formData.append("notes", photo.notes || "");

      // Optional weight
      if (photo.weight !== undefined && photo.weight !== null) {
        formData.append("weight", photo.weight.toString());
      }

      console.log(
        "☁️ Uploading photo to backend:",
        photo.id,
        "date:",
        dateStr,
        "weight:",
        photo.weight
      );
      console.log(
        "FormData entries:",
        Array.from(formData.entries()).map(([k, v]) => [
          k,
          typeof v === "object" ? "File" : v,
        ])
      );

      // Get auth token
      console.log("🔑 Getting auth token...");
      const token = await getStoredToken();
      console.log("🔑 Auth token:", token ? `Present (${token.substring(0, 20)}...)` : "❌ MISSING");
      
      if (!token) {
        console.error("❌ No auth token available - user needs to login");
        return {
          success: false,
          error: "Authentication required",
          details: "Please login to upload photos",
          willRetry: false, // Don't retry without token
        };
      }
      
      const headers: HeadersInit = {
        "Authorization": `Bearer ${token}`,
      };
      // DO NOT set Content-Type - let the browser set it with boundary for multipart/form-data

      const uploadUrl = `${BACKEND_URL}/progress/photos`;
      console.log("🚀 About to POST to:", uploadUrl);
      console.log("📋 Headers:", { Authorization: "Bearer ***" });
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: formData,
      });

      console.log("📡 Upload response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Photo uploaded successfully:", photo.id);
        await this.removeFromSyncQueue(photo.id);
        return { success: true, cloudUrl: data.url };
      } else if (response.status === 401) {
        // Unauthorized - don't retry, user needs to login
        const errorText = await response.text();
        console.error("🔐 Authentication failed - token may be expired");
        
        // Trigger logout via registered handler
        if (this.unauthorizedHandler) {
          await this.unauthorizedHandler();
        }
        
        return {
          success: false,
          error: "Authentication failed",
          details: "Please login again",
          willRetry: false,
        };
      } else {
        const errorText = await response.text();
        console.error("❌ Upload failed:", response.status, errorText);
        
        // Add to sync queue for retry (non-auth errors)
        await this.addToSyncQueue(photo.id);
        
        // Return detailed error information
        return {
          success: false,
          error: `Upload failed: ${response.status}`,
          details: errorText,
          willRetry: true
        };
      }
    } catch (error) {
      console.error("❌ Error uploading photo:", error);
      
      // Add to sync queue for retry
      await this.addToSyncQueue(photo.id);
      
      // Return detailed error information
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        willRetry: true
      };
    }
  }

  /**
   * Download photo from backend to local storage
   */
  async downloadPhoto(
    cloudUrl: string,
    photoId: string
  ): Promise<string | null> {
    try {
      const fileExtension = cloudUrl.split(".").pop()?.split("?")[0] || "jpg";
      const localUri = `${PHOTOS_DIR}${photoId}.${fileExtension}`;

      if (isWeb) {
        // Check if already in IndexedDB
        const cachedBlob = await getPhotoFromIndexedDB(photoId);
        if (cachedBlob) {
          console.log("✅ Photo already cached in IndexedDB:", photoId);
          return URL.createObjectURL(cachedBlob);
        }

        // Download and save to IndexedDB
        console.log("⬇️ Downloading photo from cloud:", photoId);
        const response = await fetch(cloudUrl);
        const blob = await response.blob();
        await savePhotoToIndexedDB(photoId, blob);

        console.log("✅ Photo downloaded and cached:", photoId);
        return URL.createObjectURL(blob);
      }

      // Native: Check if already downloaded
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        console.log("✅ Photo already cached locally:", photoId);
        return localUri;
      }

      console.log("⬇️ Downloading photo from cloud:", photoId);

      // Download from cloud
      const downloadResult = await FileSystem.downloadAsync(cloudUrl, localUri);

      if (downloadResult.status === 200) {
        console.log("✅ Photo downloaded successfully:", photoId);
        return localUri;
      } else {
        console.error("❌ Download failed:", downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error("❌ Error downloading photo:", error);
      return null;
    }
  }

  /**
   * Sync all pending photos
   */
  async syncPendingPhotos(): Promise<void> {
    if (this.isSyncing || this.syncQueue.pending.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(
      `🔄 Syncing ${this.syncQueue.pending.length} pending photos...`
    );

    const photos =
      (await storage.get<ProgressPhoto[]>(storage.keys.PROGRESS_PHOTOS)) || [];

    for (const photoId of [...this.syncQueue.pending]) {
      const photo = photos.find((p) => p.id === photoId);
      if (photo) {
        await this.uploadPhoto(photo);
      } else {
        // Photo no longer exists, remove from queue
        await this.removeFromSyncQueue(photoId);
      }
    }

    this.isSyncing = false;
    console.log("✅ Sync completed");
  }

  /**
   * Delete photo from local storage or IndexedDB
   */
  async deletePhotoLocally(photoUri: string, photoId?: string): Promise<void> {
    if (isWeb && photoId) {
      try {
        await deletePhotoFromIndexedDB(photoId);
        // Revoke blob URL if it's a blob URL
        if (photoUri.startsWith("blob:")) {
          URL.revokeObjectURL(photoUri);
        }
        console.log("🗑️ Deleted photo from IndexedDB:", photoId);
      } catch (error) {
        console.error("❌ Error deleting photo from IndexedDB:", error);
      }
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(photoUri);
        console.log("🗑️ Deleted local photo:", photoUri);
      }
    } catch (error) {
      console.error("❌ Error deleting local photo:", error);
    }
  }

  /**
   * Delete photo from backend
   */
  async deletePhotoFromCloud(photoId: string): Promise<boolean> {
    try {
      // Use centralized API config
      const BACKEND_URL = API_CONFIG.BASE_URL;

      const response = await fetch(
        `${BACKEND_URL}/progress/photos/${photoId}`,
        {
          method: "DELETE",
          headers: {
            // Add auth token here
            // 'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("❌ Error deleting photo from cloud:", error);
      return false;
    }
  }

  /**
   * Get local cache size
   */
  async getCacheSize(): Promise<number> {
    if (isWeb) {
      try {
        return await getIndexedDBSize();
      } catch (error) {
        console.error("❌ Error calculating IndexedDB size:", error);
        return 0;
      }
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(PHOTOS_DIR);
        let totalSize = 0;

        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(
            `${PHOTOS_DIR}${file}`
          );
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += fileInfo.size || 0;
          }
        }

        return totalSize;
      }
      return 0;
    } catch (error) {
      console.error("❌ Error calculating cache size:", error);
      return 0;
    }
  }

  /**
   * Clear all cached photos
   */
  async clearCache(): Promise<void> {
    if (isWeb) {
      try {
        await clearIndexedDB();
        console.log("🗑️ Cleared IndexedDB photo cache");
      } catch (error) {
        console.error("❌ Error clearing IndexedDB:", error);
      }
      return;
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(PHOTOS_DIR);
        await FileSystem.makeDirectoryAsync(PHOTOS_DIR, {
          intermediates: true,
        });
        console.log("🗑️ Cleared photo cache");
      }
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
    }
  }

  // Private helper methods
  private async addToSyncQueue(photoId: string): Promise<void> {
    if (!this.syncQueue.pending.includes(photoId)) {
      this.syncQueue.pending.push(photoId);
      await this.saveSyncQueue();
    }
  }

  private async removeFromSyncQueue(photoId: string): Promise<void> {
    this.syncQueue.pending = this.syncQueue.pending.filter(
      (id) => id !== photoId
    );
    this.syncQueue.failed = this.syncQueue.failed.filter(
      (id) => id !== photoId
    );
    await this.saveSyncQueue();
  }

  private async saveSyncQueue(): Promise<void> {
    await storage.set(storage.keys.PHOTO_SYNC_QUEUE, this.syncQueue);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { pending: number; failed: number; syncing: boolean } {
    return {
      pending: this.syncQueue.pending.length,
      failed: this.syncQueue.failed.length,
      syncing: this.isSyncing,
    };
  }

  /**
   * Restore blob URLs for photos loaded from storage (web only)
   * Call this after loading photos from AsyncStorage to recreate blob URLs from IndexedDB
   */
  async restoreBlobUrls(photos: ProgressPhoto[]): Promise<ProgressPhoto[]> {
    if (!isWeb) {
      return photos; // No need on native
    }

    console.log('🔄 Restoring blob URLs for', photos.length, 'photos...');
    
    const restoredPhotos = await Promise.all(
      photos.map(async (photo) => {
        // Check if URI is a blob URL (they start with 'blob:')
        if (photo.uri.startsWith('blob:')) {
          try {
            // Get blob from IndexedDB
            const blob = await getPhotoFromIndexedDB(photo.id);
            if (blob) {
              // Create new blob URL
              const newBlobUrl = URL.createObjectURL(blob);
              console.log('✅ Restored blob URL for photo:', photo.id);
              return { ...photo, uri: newBlobUrl };
            } else {
              console.warn('⚠️ Photo not found in IndexedDB:', photo.id);
              return photo;
            }
          } catch (error) {
            console.error('❌ Error restoring blob URL:', error);
            return photo;
          }
        }
        return photo;
      })
    );

    console.log('✅ Blob URLs restored');
    return restoredPhotos;
  }
}

export const photoSyncService = new PhotoSyncService();
