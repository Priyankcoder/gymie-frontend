
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
  pickProgressPhoto: (weight?: number) => Promise<string | null>;
  takeProgressPhoto: (weight?: number) => Promise<string | null>;
  saveProgressPhoto: (uri: string, weight?: number, notes?: string) => Promise<void>;
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

  const pickProgressPhoto = async (weight?: number) => {
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
      return result.assets[0].uri;
    }
    return null;
  };

  const saveProgressPhoto = async (uri: string, weight?: number, notes?: string) => {
    try {
      const photoId = Date.now().toString();
      
      // Save photo to local file system
      const localUri = await photoSyncService.savePhotoLocally(uri, photoId);

      const newPhoto: ProgressPhoto = {
        id: photoId,
        uri: localUri,
        date: new Date().toISOString(),
        notes: notes || '',
        weight,
      };

      // Save to local storage
      console.log('📝 Saving photo to local storage with ID:', photoId);
      const response = await api.photos.create(newPhoto);
      console.log('✅ Photo saved to local storage:', response.data?.id);
      
      if (response.data) {
        setProgressPhotos(prev => [response.data!, ...prev]);
        
        // If weight is provided, also create a weight log entry
        if (weight) {
          try {
            await api.weightLogs.create({
              weight,
              date: new Date().toISOString(),
              notes: 'Progress photo weight',
            });
            console.log('✅ Weight log created:', weight);
          } catch (error) {
            console.error('❌ Error creating weight log:', error);
          }
        }
        
        // Upload to cloud in background
        console.log('🚀 Initiating cloud upload for photo:', response.data.id);
        photoSyncService.uploadPhoto(response.data).then(result => {
          console.log('📤 Upload result:', result);
          if (result.success && result.cloudUrl) {
            console.log('✅ Photo uploaded to cloud:', result.cloudUrl);
          } else if (result.willRetry) {
            console.log('⏳ Photo will be synced when connection is available');
          } else if (result.error?.includes('Authentication')) {
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
  };

  const takeProgressPhoto = async (weight?: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take progress photos.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
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
    saveProgressPhoto,
    deletePhoto,
    groupPhotosByMonth,
    formatMonthYear,
  };
};
