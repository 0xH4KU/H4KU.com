import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { use100vh } from '../use100vh';

describe('use100vh', () => {
  beforeEach(() => {
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    // Mock document.documentElement.style.setProperty
    document.documentElement.style.setProperty = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set --vh CSS variable on mount', () => {
    renderHook(() => use100vh());

    // Should set --vh to 1% of window height (1000 * 0.01 = 10px)
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--vh',
      '10px'
    );
  });

  it('should update --vh on window resize', () => {
    renderHook(() => use100vh());

    const setPropertySpy = vi.mocked(
      document.documentElement.style.setProperty
    );

    // Clear previous calls
    setPropertySpy.mockClear();

    // Simulate resize
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    window.dispatchEvent(new Event('resize'));

    // Should update --vh to new value (800 * 0.01 = 8px)
    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '8px');
  });

  it('should handle multiple resizes', () => {
    renderHook(() => use100vh());

    const setPropertySpy = vi.mocked(
      document.documentElement.style.setProperty
    );

    const heights = [600, 900, 1200];

    heights.forEach(height => {
      setPropertySpy.mockClear();

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });

      window.dispatchEvent(new Event('resize'));

      expect(setPropertySpy).toHaveBeenCalledWith('--vh', `${height * 0.01}px`);
    });
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => use100vh());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('should calculate vh correctly for different screen sizes', () => {
    const testCases = [
      { height: 500, expected: '5px' },
      { height: 1024, expected: '10.24px' },
      { height: 1440, expected: '14.4px' },
      { height: 768, expected: '7.68px' },
    ];

    testCases.forEach(({ height, expected }) => {
      const setPropertySpy = vi.mocked(
        document.documentElement.style.setProperty
      );
      setPropertySpy.mockClear();

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });

      renderHook(() => use100vh());

      expect(setPropertySpy).toHaveBeenCalledWith('--vh', expected);
    });
  });
});
