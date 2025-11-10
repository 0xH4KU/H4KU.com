import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReducedMotion } from '../useReducedMotion';

type MatchMediaMock = {
  matches: boolean;
  media: string;
  addEventListener: (
    event: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  removeEventListener: (
    event: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
};

describe('useReducedMotion', () => {
  let matchMediaMock: MatchMediaMock;
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(
        (event: string, listener: (event: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.push(listener);
          }
        }
      ),
      removeEventListener: vi.fn(
        (event: string, listener: (event: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== listener);
          }
        }
      ),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => matchMediaMock as unknown as MediaQueryList),
    });
  });

  it('should return false when reduced motion is not preferred', () => {
    matchMediaMock.matches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when reduced motion is preferred', () => {
    matchMediaMock.matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    matchMediaMock.matches = false;
    const { result, rerender } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const event = { matches: true } as MediaQueryListEvent;
      listeners.forEach(listener => listener(event));
    });

    rerender();

    expect(result.current).toBe(true);
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());

    expect(matchMediaMock.addEventListener).toHaveBeenCalled();

    unmount();

    expect(matchMediaMock.removeEventListener).toHaveBeenCalled();
  });
});
