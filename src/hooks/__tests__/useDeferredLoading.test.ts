import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useDeferredLoading,
  useDeferredAsync,
  useDeferredValue,
  withMinDuration,
  DEFAULT_LOADING_DELAY,
} from '../useDeferredLoading';

describe('useDeferredLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports default delay constant', () => {
    expect(DEFAULT_LOADING_DELAY).toBe(500);
  });

  it('does not show loading initially', () => {
    const { result } = renderHook(() => useDeferredLoading());
    expect(result.current.showLoading).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isLoading immediately on startLoading', () => {
    const { result } = renderHook(() => useDeferredLoading());

    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.showLoading).toBe(false);
  });

  it('shows loading after delay threshold', () => {
    const { result } = renderHook(() => useDeferredLoading({ delay: 500 }));

    act(() => {
      result.current.startLoading();
    });

    // Before delay
    expect(result.current.showLoading).toBe(false);

    // After delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.showLoading).toBe(true);
  });

  it('never shows loading if operation completes before delay', () => {
    const { result } = renderHook(() => useDeferredLoading({ delay: 500 }));

    act(() => {
      result.current.startLoading();
    });

    // Complete before delay
    act(() => {
      vi.advanceTimersByTime(300);
      result.current.endLoading();
    });

    expect(result.current.showLoading).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('maintains loading for minimum duration once shown', () => {
    const { result } = renderHook(() =>
      useDeferredLoading({ delay: 500, minDuration: 300 })
    );

    act(() => {
      result.current.startLoading();
    });

    // Show loading
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.showLoading).toBe(true);

    // End loading immediately after showing
    act(() => {
      result.current.endLoading();
    });

    // Should still show loading (min duration not met)
    expect(result.current.showLoading).toBe(true);

    // After min duration
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.showLoading).toBe(false);
  });

  it('hides loading immediately if min duration already met', () => {
    const { result } = renderHook(() =>
      useDeferredLoading({ delay: 500, minDuration: 300 })
    );

    act(() => {
      result.current.startLoading();
    });

    // Show loading
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Wait past min duration
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // End loading
    act(() => {
      result.current.endLoading();
    });

    // Should hide immediately
    expect(result.current.showLoading).toBe(false);
  });
});

describe('useDeferredAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes async function and returns result', async () => {
    const { result } = renderHook(() => useDeferredAsync<string>());

    let executeResult: string | undefined;
    await act(async () => {
      executeResult = await result.current.execute(async () => 'success');
    });

    expect(executeResult).toBe('success');
  });

  it('captures error from async function', async () => {
    const { result } = renderHook(() => useDeferredAsync());

    await act(async () => {
      await result.current.execute(async () => {
        throw new Error('Test error');
      });
    });

    expect(result.current.error?.message).toBe('Test error');
  });

  it('clears error with clearError', async () => {
    const { result } = renderHook(() => useDeferredAsync());

    await act(async () => {
      await result.current.execute(async () => {
        throw new Error('Test error');
      });
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useDeferredValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null initially for truthy value', () => {
    const { result } = renderHook(() => useDeferredValue(true, { delay: 500 }));
    expect(result.current.value).toBeNull();
    expect(result.current.isDeferred).toBe(true);
  });

  it('returns value after delay', () => {
    const { result } = renderHook(() => useDeferredValue(true, { delay: 500 }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.value).toBe(true);
    expect(result.current.isDeferred).toBe(false);
  });

  it('resets immediately when value becomes falsy', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDeferredValue(value, { delay: 500 }),
      { initialProps: { value: true as boolean | null } }
    );

    // Advance past delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.value).toBe(true);

    // Change to falsy
    rerender({ value: null });

    expect(result.current.value).toBeNull();
    expect(result.current.isDeferred).toBe(true);
  });
});

describe('withMinDuration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately if promise takes longer than minDuration', async () => {
    const slowPromise = new Promise<string>(resolve => {
      setTimeout(() => resolve('slow'), 600);
    });

    const resultPromise = withMinDuration(slowPromise, 300);

    // Advance past both durations
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const result = await resultPromise;
    expect(result).toBe('slow');
  });

  it('waits for minDuration if promise resolves quickly', async () => {
    const fastPromise = new Promise<string>(resolve => {
      setTimeout(() => resolve('fast'), 100);
    });

    const resultPromise = withMinDuration(fastPromise, 500);

    // Fast promise resolves
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Still waiting for min duration
    let resolved = false;
    resultPromise.then(() => {
      resolved = true;
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(resolved).toBe(false);

    // Complete min duration
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const result = await resultPromise;
    expect(result).toBe('fast');
  });
});
