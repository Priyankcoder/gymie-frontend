
/**
 * Generic hook for handling async data fetching with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '../types';

interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useAsyncData = <T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  deps: any[] = []
): UseAsyncDataResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('useAsyncData error:', err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
