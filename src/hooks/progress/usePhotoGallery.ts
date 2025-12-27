
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { photoSyncService } from '../../services/photoSyncService';
import { ProgressPhoto } from '../../types';

interface UsePhotoGalleryReturn {
  progressPhotos: ProgressPhoto[];
  compareMode: boolean;
  selectedPhotos: string[];
  setProgressPhotos: (photos: ProgressPhoto[]) => void;
  toggleCompareMode: () => void;
  togglePhotoSelection: (photoId: string) => void;
  pickProgressPhoto: () => Promise<void>;
  takeProgressPhoto: () => Promise<void>;
  deletePhoto: (photoId: string) => void;
  groupPhotosByMonth: () => [string, ProgressPhoto[]][];
  formatMonthYear: (key: string) => string;
}

export const usePhotoGallery = (
  initialPhotos: ProgressPhoto[] = []
): UsePhotoGalleryReturn => {
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(initialPhotos);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Initialize photo sync service
  useEffect(() => {
    photoSyncService.initialize();
  }, []);

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      setSelectedPhotos([]);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      }
      if (prev.length < 2) {
        return [...prev, photoId];
      }
      return [prev[1], photoId];
    });
  };

  const pickProgressPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add progress photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const photoId = Date.now().toString();
        
        // Save photo to local file system
        const localUri = await photoSyncService.savePhotoLocally(
          result.assets[0].uri,
          photoId
        );

        const newPhoto: ProgressPhoto = {
          id: photoId,
          uri: localUri, // Use local URI
          date: new Date().toISOString(),
          notes: '',
        };

        // Save to local storage (pass full photo with ID to preserve IndexedDB key)
        console.log('📝 Saving photo to local storage with ID:', photoId);
        const response = await api.photos.create(newPhoto);
        console.log('✅ Photo saved to local storage:', response.data?.id);
        
        if (response.data) {
          setProgressPhotos(prev => [response.data!, ...prev]);
          
          // Upload to cloud in background
          console.log('🚀 Initiating cloud upload for photo:', response.data.id);
          photoSyncService.uploadPhoto(response.data).then(result => {
            console.log('📤 Upload result:', result);
            if (result.success && result.cloudUrl) {
              console.log('✅ Photo uploaded to cloud:', result.cloudUrl);
              // Optionally update photo with cloud URL
            } else if (result.willRetry) {
              // Upload failed but will retry automatically
              console.log('⏳ Photo will be synced when connection is available');
            } else if (result.error?.includes('Authentication')) {
              // Authentication error - show alert
              console.error('🔐 Authentication required');
              Alert.alert(
                'Login Required',
                'Please login to sync your photos to the cloud.',
                [{ text: 'OK' }]
              );
            } else {
              console.log('❌ Upload failed:', result.error);
            }
          }).catch(error => {
            console.error('❌ Upload promise rejected:', error);
          });
        } else {
          console.error('❌ No data returned from api.photos.create');
        }
      } catch (error) {
        console.error('❌ Error saving photo:', error);
        Alert.alert('Error', 'Failed to save photo. Please try again.');
      }
    }
  };

  const takeProgressPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take progress photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const photoId = Date.now().toString();
        
        // Save photo to local file system
        const localUri = await photoSyncService.savePhotoLocally(
          result.assets[0].uri,
          photoId
        );

        const newPhoto: ProgressPhoto = {
          id: photoId,
          uri: localUri, // Use local URI
          date: new Date().toISOString(),
          notes: '',
        };

        // Save to local storage (pass full photo with ID to preserve IndexedDB key)
        console.log('📝 Saving camera photo to local storage with ID:', photoId);
        const response = await api.photos.create(newPhoto);
        console.log('✅ Camera photo saved to local storage:', response.data?.id);
        
        if (response.data) {
          setProgressPhotos(prev => [response.data!, ...prev]);
          
          // Upload to cloud in background
          console.log('🚀 Initiating cloud upload for camera photo:', response.data.id);
          photoSyncService.uploadPhoto(response.data).then(result => {
            console.log('📤 Camera upload result:', result);
            if (result.success && result.cloudUrl) {
              console.log('✅ Photo uploaded to cloud:', result.cloudUrl);
            } else if (result.willRetry) {
              console.log('⏳ Photo will be synced when connection is available');
            } else if (result.error?.includes('Authentication')) {
              // Authentication error - show alert
              console.error('🔐 Authentication required');
              Alert.alert(
                'Login Required',
                'Please login to sync your photos to the cloud.',
                [{ text: 'OK' }]
              );
            } else {
              console.log('❌ Upload failed:', result.error);
            }
          }).catch(error => {
            console.error('❌ Camera upload promise rejected:', error);
          });
        } else {
          console.error('❌ No data returned from api.photos.create (camera)');
        }
      } catch (error) {
        console.error('❌ Error taking photo:', error);
        Alert.alert('Error', 'Failed to save photo. Please try again.');
      }
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this progress photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const photo = progressPhotos.find(p => p.id === photoId);
            
            // Delete from local storage
            await api.photos.delete(photoId);
            
            // Delete local file
            if (photo) {
              await photoSyncService.deletePhotoLocally(photo.uri, photo.id);
            }
            
            // Delete from cloud (if uploaded)
            await photoSyncService.deletePhotoFromCloud(photoId);
            
            setProgressPhotos(prev => prev.filter(p => p.id !== photoId));
            setSelectedPhotos(prev => prev.filter(id => id !== photoId));
          },
        },
      ]
    );
  };

  const groupPhotosByMonth = (): [string, ProgressPhoto[]][] => {
    const groups: { [key: string]: ProgressPhoto[] } = {};
    progressPhotos.forEach(photo => {
      const date = new Date(photo.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(photo);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const formatMonthYear = (key: string): string => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return {
    progressPhotos,
    compareMode,
    selectedPhotos,
    setProgressPhotos,
    toggleCompareMode,
    togglePhotoSelection,
    pickProgressPhoto,
    takeProgressPhoto,
    deletePhoto,
    groupPhotosByMonth,
    formatMonthYear,
  };
};
