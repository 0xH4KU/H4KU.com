import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Advance timers inside act
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: '1', delay: 500 },
      }
    );

    // Make multiple rapid changes
    rerender({ value: '2', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: '3', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: '4', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Still should have initial value
    expect(result.current).toBe('1');

    // Advance remaining time
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe('4');
  });

  it('should work with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 42, delay: 300 },
      }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100, delay: 300 });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toBe(100);
  });

  it('should work with objects', () => {
    const obj1 = { name: 'test', value: 1 };
    const obj2 = { name: 'updated', value: 2 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: obj1, delay: 300 },
      }
    );

    expect(result.current).toEqual(obj1);

    rerender({ value: obj2, delay: 300 });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current).toEqual(obj2);
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      // Advance by old delay
      vi.advanceTimersByTime(500);
    });

    // Should still be initial value (new delay is 1000ms)
    expect(result.current).toBe('test');

    act(() => {
      // Advance remaining time
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
