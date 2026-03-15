import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { ProgressPhoto } from "../types";
import { storage } from "./localStorage";
import { getStoredToken } from "./authStorage";
import { API_CONFIG } from "../config/api";
import { uploadToCloudinary } from "./userProfileApi";

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
   * Upload photo to Cloudinary, then register the URL with the backend
   */
  async uploadPhoto(
    photo: ProgressPhoto
  ): Promise<{ success: boolean; cloudUrl?: string; willRetry?: boolean; error?: string }> {
    try {
      console.log("🔄 Starting upload for photo:", photo.id);

      if (!isWeb) {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          console.log("📴 No internet connection, queuing photo for later sync");
          await this.addToSyncQueue(photo.id);
          return { success: false, willRetry: true };
        }
      }

      // Step 1: Upload image directly to Cloudinary
      console.log("☁️ Uploading to Cloudinary:", photo.id);
      let cloudinaryUrl: string;
      try {
        // On web, photo.uri may be a blob URL — fetch it and re-create a file:// -style data URI
        cloudinaryUrl = await uploadToCloudinary(photo.uri);
        console.log("✅ Cloudinary upload success:", cloudinaryUrl);
      } catch (err) {
        console.error("❌ Cloudinary upload failed:", err);
        await this.addToSyncQueue(photo.id);
        return { success: false, willRetry: true, error: err instanceof Error ? err.message : 'Cloudinary upload failed' };
      }

      // Step 2: Register the Cloudinary URL with our backend
      const token = await getStoredToken();
      if (!token) {
        console.error("❌ No auth token available");
        return { success: false, willRetry: false, error: "Authentication required" };
      }

      const body = JSON.stringify({
        imageUrl: cloudinaryUrl,
        date: new Date(photo.date).toISOString(),
        notes: photo.notes || "",
        ...(photo.weight !== undefined && photo.weight !== null ? { weight: photo.weight } : {}),
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/progress/photos`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Photo registered with backend:", photo.id);
        await this.removeFromSyncQueue(photo.id);
        return { success: true, cloudUrl: data.data?.imageUrl ?? cloudinaryUrl };
      } else if (response.status === 401) {
        console.error("🔐 Authentication failed");
        if (this.unauthorizedHandler) {
          await this.unauthorizedHandler();
        }
        return { success: false, willRetry: false, error: "Authentication failed" };
      } else {
        const errorText = await response.text();
        console.error("❌ Backend registration failed:", response.status, errorText);
        await this.addToSyncQueue(photo.id);
        return { success: false, willRetry: true, error: `Backend error: ${response.status}` };
      }
    } catch (error) {
      console.error("❌ Error uploading photo:", error);
      await this.addToSyncQueue(photo.id);
      return { success: false, willRetry: true, error: error instanceof Error ? error.message : 'Unknown error' };
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
      const token = await getStoredToken();
      if (!token) {
        console.error("❌ No auth token available for delete");
        return false;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/progress/photos/${photoId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
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
