import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('should return stored value if it exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value is set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should work with different data types', () => {
    const testCases = [
      { key: 'string', value: 'test' },
      { key: 'number', value: 42 },
      { key: 'boolean', value: true },
      { key: 'object', value: { name: 'test', value: 123 } },
      { key: 'array', value: [1, 2, 3] },
      { key: 'null', value: null },
    ];

    testCases.forEach(({ key, value }) => {
      const { result } = renderHook(() => useLocalStorage(key, value));

      expect(result.current[0]).toEqual(value);

      act(() => {
        result.current[1](value);
      });

      const stored = localStorage.getItem(key);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toEqual(value);
    });
  });

  it('should accept function as value setter', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](prev => prev + 5);
    });

    expect(result.current[0]).toBe(6);
  });

  it('should handle storage event from another tab', () => {
    const { result } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    );

    expect(result.current[0]).toBe('initial');

    // Simulate storage event from another tab
    act(() => {
      localStorage.setItem('shared-key', JSON.stringify('from-another-tab'));
      const storageEvent = new Event('storage');
      Object.defineProperty(storageEvent, 'key', { value: 'shared-key' });
      Object.defineProperty(storageEvent, 'newValue', {
        value: JSON.stringify('from-another-tab'),
      });
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('from-another-tab');
  });

  it('should ignore storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('my-key', 'initial'));

    act(() => {
      const storageEvent = new Event('storage');
      Object.defineProperty(storageEvent, 'key', { value: 'other-key' });
      Object.defineProperty(storageEvent, 'newValue', {
        value: JSON.stringify('other-value'),
      });
      window.dispatchEvent(storageEvent);
    });

    // Value should not change
    expect(result.current[0]).toBe('initial');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Set invalid JSON
    localStorage.setItem('corrupted-key', 'this is not valid JSON {]');

    const { result } = renderHook(() =>
      useLocalStorage('corrupted-key', 'fallback')
    );

    // Should fall back to initial value
    expect(result.current[0]).toBe('fallback');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle localStorage quota exceeded error', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock setItem to throw quota exceeded error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn((key, value) => {
      if (key === 'test-key' && value === JSON.stringify('large-value')) {
        throw new DOMException('QuotaExceededError');
      }
      originalSetItem.call(localStorage, key, value);
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('large-value');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore
    localStorage.setItem = originalSetItem;
    consoleErrorSpy.mockRestore();
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useLocalStorage('test-key', 'value'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    );
  });

  it('should persist value across hook instances with same key', () => {
    const { result: result1 } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    );

    act(() => {
      result1.current[1]('updated-value');
    });

    // Create second instance with same key
    const { result: result2 } = renderHook(() =>
      useLocalStorage('shared-key', 'initial')
    );

    expect(result2.current[0]).toBe('updated-value');
  });

  it('should handle storage event with null newValue', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      // Storage event with null newValue (item was removed)
      const storageEvent = new Event('storage');
      Object.defineProperty(storageEvent, 'key', { value: 'test-key' });
      Object.defineProperty(storageEvent, 'newValue', { value: null });
      window.dispatchEvent(storageEvent);
    });

    // Value should remain unchanged (we ignore null newValue)
    expect(result.current[0]).toBe('initial');
  });

  it('should handle corrupted data in storage event', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      // Storage event with invalid JSON
      const storageEvent = new Event('storage');
      Object.defineProperty(storageEvent, 'key', { value: 'test-key' });
      Object.defineProperty(storageEvent, 'newValue', {
        value: 'invalid JSON {]',
      });
      window.dispatchEvent(storageEvent);
    });

    // Value should remain unchanged
    expect(result.current[0]).toBe('initial');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
