import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { use100vh } from '../use100vh';

type MutableVisualViewport = {
  -readonly [K in keyof VisualViewport]: VisualViewport[K];
};

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

    Reflect.deleteProperty(window, 'visualViewport');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'visualViewport');
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
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'orientationchange',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'pageshow',
      expect.any(Function)
    );
  });

  it('should prefer visualViewport height when available', () => {
    const addEventListenerMock = vi.fn();
    const mockVisualViewport = {
      height: 900,
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
    } as unknown as MutableVisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: mockVisualViewport,
    });

    renderHook(() => use100vh());

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--vh',
      '9px'
    );

    expect(addEventListenerMock).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
  });

  it('should update when visualViewport triggers events', () => {
    vi.useFakeTimers();

    let resizeCallback: (() => void) | undefined;
    let scrollCallback: (() => void) | undefined;
    const mockVisualViewport = {
      height: 900,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'resize') {
          resizeCallback = cb;
        }
        if (event === 'scroll') {
          scrollCallback = cb;
        }
      }),
      removeEventListener: vi.fn(),
    } as unknown as MutableVisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: mockVisualViewport,
    });

    renderHook(() => use100vh());

    const setPropertySpy = vi.mocked(
      document.documentElement.style.setProperty
    );
    setPropertySpy.mockClear();

    mockVisualViewport.height = 750;
    resizeCallback?.();
    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '7.5px');

    setPropertySpy.mockClear();
    mockVisualViewport.height = 700;
    scrollCallback?.();
    // Scroll events are throttled with 100ms delay
    vi.advanceTimersByTime(100);
    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '7px');

    vi.useRealTimers();
  });

  it('should clean up visualViewport listeners on unmount', () => {
    const removeEventListenerMock = vi.fn();
    const mockVisualViewport = {
      height: 1024,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
    } as unknown as MutableVisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: mockVisualViewport,
    });

    const { unmount } = renderHook(() => use100vh());
    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
  });

  it('should recalculate on orientation changes', () => {
    renderHook(() => use100vh());

    const setPropertySpy = vi.mocked(
      document.documentElement.style.setProperty
    );
    setPropertySpy.mockClear();

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 720,
    });

    window.dispatchEvent(new Event('orientationchange'));

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '7.2px');
  });

  it('should recalculate when returning from bfcache', () => {
    renderHook(() => use100vh());

    const setPropertySpy = vi.mocked(
      document.documentElement.style.setProperty
    );
    setPropertySpy.mockClear();

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 640,
    });

    const pageShowEvent = new Event('pageshow') as Event & {
      persisted?: boolean;
    };
    pageShowEvent.persisted = true;

    window.dispatchEvent(pageShowEvent);

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '6.4px');
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
