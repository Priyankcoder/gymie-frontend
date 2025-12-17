
/**
 * Hook to refetch data when screen comes into focus
 * Uses Expo Router's useFocusEffect
 */

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export const useRefreshOnFocus = (refetch: () => void | Promise<void>) => {
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
};
