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

  it('handles BASE_URL stripping and reapplication', () => {
    vi.stubEnv('BASE_URL', '/app/');
    window.history.replaceState({}, '', '/app/current');
    const pushSpy = vi.spyOn(window.history, 'pushState');

    const { result } = renderHook(() => useHistoryNavigation());
    expect(result.current.pathname).toBe('/current');

    act(() => {
      result.current.navigate('/next');
    });

    expect(pushSpy).toHaveBeenCalledWith(null, '', '/app/next');
    expect(result.current.pathname).toBe('/next');
    vi.unstubAllEnvs();
  });

  it('does not push when navigating to the same path without replace', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/same');
    });
    const initialCalls = pushSpy.mock.calls.length;

    act(() => {
      result.current.navigate('/same');
    });

    expect(pushSpy.mock.calls.length).toBe(initialCalls);
    expect(result.current.pathname).toBe('/same');
  });

  it('applies BASE_URL root mapping correctly', () => {
    vi.stubEnv('BASE_URL', '/base');
    window.history.replaceState({}, '', '/base/');

    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('/');
    });

    expect(window.location.pathname).toBe('/base/');
    vi.unstubAllEnvs();
  });

  it('normalizes empty path to /', () => {
    const { result } = renderHook(() => useHistoryNavigation());

    act(() => {
      result.current.navigate('');
    });

    expect(result.current.pathname).toBe('/');
  });
});
