
import { renderHook, act } from '@testing-library/react-native';
import { useModalManager } from '../useModalManager';

describe('useModalManager', () => {
  it('initializes with no active modal', () => {
    const { result } = renderHook(() => useModalManager());
    
    expect(result.current.activeModal).toBeNull();
    expect(result.current.modalData).toBeUndefined();
  });

  it('opens modal correctly', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    
    expect(result.current.activeModal).toBe('exercise');
    expect(result.current.isOpen('exercise')).toBe(true);
  });

  it('closes modal correctly', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    
    expect(result.current.activeModal).toBe('exercise');
    
    act(() => {
      result.current.closeModal();
    });
    
    expect(result.current.activeModal).toBeNull();
    expect(result.current.isOpen('exercise')).toBe(false);
  });

  it('handles modal data', () => {
    const { result } = renderHook(() => useModalManager());
    const testData = { id: '123', name: 'Test Exercise' };
    
    act(() => {
      result.current.openModal('exercise', testData);
    });
    
    expect(result.current.modalData).toEqual(testData);
    expect(result.current.activeModal).toBe('exercise');
  });

  it('clears modal data when closing', () => {
    const { result } = renderHook(() => useModalManager());
    const testData = { id: '123' };
    
    act(() => {
      result.current.openModal('exercise', testData);
    });
    
    expect(result.current.modalData).toEqual(testData);
    
    act(() => {
      result.current.closeModal();
    });
    
    expect(result.current.modalData).toBeUndefined();
  });

  it('replaces active modal when opening new one', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    
    expect(result.current.activeModal).toBe('exercise');
    
    act(() => {
      result.current.openModal('rest-timer');
    });
    
    expect(result.current.activeModal).toBe('rest-timer');
    expect(result.current.isOpen('exercise')).toBe(false);
    expect(result.current.isOpen('rest-timer')).toBe(true);
  });

  it('isOpen returns false for non-active modal', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    
    expect(result.current.isOpen('rest-timer')).toBe(false);
    expect(result.current.isOpen('exercise')).toBe(true);
  });

  it('handles multiple open/close cycles', () => {
    const { result } = renderHook(() => useModalManager());
    
    act(() => {
      result.current.openModal('exercise');
    });
    expect(result.current.activeModal).toBe('exercise');
    
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.activeModal).toBeNull();
    
    act(() => {
      result.current.openModal('rest-timer');
    });
    expect(result.current.activeModal).toBe('rest-timer');
    
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.activeModal).toBeNull();
  });
});
