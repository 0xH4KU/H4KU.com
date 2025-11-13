import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryNavigation } from '@/hooks/useHistoryNavigation';

describe('useHistoryNavigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes new paths and updates pathname state', () => {
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/folder/featured');
    });

    expect(result.current.pathname).toBe('/folder/featured');
    expect(window.location.pathname).toBe('/folder/featured');
  });

  it('replaces history entries when requested', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/initial');
    });
    act(() => {
      result.current.navigate('/next', { replace: true });
    });

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalled();
    expect(result.current.pathname).toBe('/next');
  });

  it('still updates state when replacing the same path', () => {
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/duplicate');
      result.current.navigate('/duplicate', { replace: true });
    });

    expect(result.current.pathname).toBe('/duplicate');
  });

  it('falls back to local state when window.history is unavailable', () => {
    const historyGetter = vi
      .spyOn(window, 'history', 'get')
      .mockReturnValue(undefined as unknown as History);

    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/offline');
    });

    expect(result.current.pathname).toBe('/offline');

    historyGetter.mockRestore();
  });

  it('responds to programmatic popstate events', () => {
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/first');
      result.current.navigate('/second');
    });
    expect(result.current.pathname).toBe('/second');

    act(() => {
      window.history.replaceState({}, '', '/first');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.pathname).toBe('/first');
  });
});
