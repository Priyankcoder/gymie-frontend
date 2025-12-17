
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAsyncData } from '../useAsyncData';

describe('useAsyncData', () => {
  it('initializes with loading state', () => {
    const mockFetcher = jest.fn(() => Promise.resolve({ success: true, data: 'data' }));
    const { result } = renderHook(() => useAsyncData(mockFetcher));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = jest.fn(() => Promise.resolve({ success: true, data: mockData }));
    
    const { result } = renderHook(() => useAsyncData(mockFetcher));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('handles errors correctly', async () => {
    const mockError = new Error('Fetch failed');
    const mockFetcher = jest.fn(() => Promise.reject(mockError));
    
    const { result } = renderHook(() => useAsyncData(mockFetcher));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Fetch failed');
  });

  it('refetches data when refetch is called', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };
    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({ success: true, data: mockData1 })
      .mockResolvedValueOnce({ success: true, data: mockData2 });
    
    const { result } = renderHook(() => useAsyncData(mockFetcher));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData1);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    
    act(() => {
      result.current.refetch();
    });
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData2);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });

  it('clears error on successful refetch', async () => {
    const mockError = new Error('First error');
    const mockData = { id: 1, name: 'Success' };
    const mockFetcher = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ success: true, data: mockData });
    
    const { result } = renderHook(() => useAsyncData(mockFetcher));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('First error');
    expect(result.current.data).toBeNull();
    
    act(() => {
      result.current.refetch();
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockData);
  });

  it('does not update state if unmounted during fetch', async () => {
    const mockFetcher = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: true, data: 'data' }), 100)));
    
    const { result, unmount } = renderHook(() => useAsyncData(mockFetcher));
    
    expect(result.current.loading).toBe(true);
    
    unmount();
    
    // Should not throw or cause errors
    await new Promise(resolve => setTimeout(resolve, 150));
  });
});
