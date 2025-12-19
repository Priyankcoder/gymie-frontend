
import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
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
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        date: new Date().toISOString(),
        notes: '',
      };

      const response = await api.photos.create(newPhoto);
      if (response.data) {
        setProgressPhotos(prev => [response.data!, ...prev]);
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
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        date: new Date().toISOString(),
        notes: '',
      };

      const response = await api.photos.create(newPhoto);
      if (response.data) {
        setProgressPhotos(prev => [response.data!, ...prev]);
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
            await api.photos.delete(photoId);
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
