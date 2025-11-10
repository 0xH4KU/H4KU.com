import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCrosshair } from '../useCrosshair';

describe('useCrosshair', () => {
  let requestAnimationFrameSpy: ReturnType<typeof vi.fn>;
  let cancelAnimationFrameSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Mock navigator for touch device detection - explicitly set to non-touch
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });

    // Remove any touch event support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).ontouchstart;

    // Mock requestAnimationFrame
    let frameId = 0;
    requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        callback(0);
        return ++frameId;
      });

    cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    // Clear body classes
    document.body.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
  });

  it('should initialize with crosshair enabled on non-touch devices', () => {
    const { result } = renderHook(() => useCrosshair());

    expect(result.current.showCrosshair).toBe(true);
    expect(document.body.classList.contains('crosshair-active')).toBe(true);
  });

  it('should initialize with crosshair disabled on touch devices', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });

    const { result } = renderHook(() => useCrosshair());

    expect(result.current.showCrosshair).toBe(false);
    expect(document.body.classList.contains('crosshair-active')).toBe(false);
  });

  it('should initialize mouse position to center of window', () => {
    const { result } = renderHook(() => useCrosshair());

    expect(result.current.mousePos).toEqual({
      x: Math.round(1024 / 2),
      y: Math.round(768 / 2),
    });
  });

  it('should update mouse position on mouse move', () => {
    const { result } = renderHook(() => useCrosshair());

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 200,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.mousePos).toEqual({ x: 300, y: 200 });
  });

  it('should use requestAnimationFrame for mouse move updates', () => {
    renderHook(() => useCrosshair());

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 200,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should cancel previous animation frame on rapid mouse moves', () => {
    renderHook(() => useCrosshair());

    // Rapid mouse moves
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 100 })
      );
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 200, clientY: 200 })
      );
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 300, clientY: 300 })
      );
    });

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should toggle crosshair on Escape key press', () => {
    const { result } = renderHook(() => useCrosshair());

    const initialState = result.current.showCrosshair;

    act(() => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(keydownEvent);
    });

    expect(result.current.showCrosshair).toBe(!initialState);
  });

  it('should not toggle crosshair on other key presses', () => {
    const { result } = renderHook(() => useCrosshair());

    const initialState = result.current.showCrosshair;

    act(() => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(keydownEvent);
    });

    expect(result.current.showCrosshair).toBe(initialState);
  });

  it('should toggle crosshair via toggleCrosshair function', () => {
    const { result } = renderHook(() => useCrosshair());

    const initialState = result.current.showCrosshair;

    act(() => {
      result.current.toggleCrosshair();
    });

    expect(result.current.showCrosshair).toBe(!initialState);

    act(() => {
      result.current.toggleCrosshair();
    });

    expect(result.current.showCrosshair).toBe(initialState);
  });

  it('should add crosshair-active class when enabled', () => {
    const { result } = renderHook(() => useCrosshair());

    if (!result.current.showCrosshair) {
      act(() => {
        result.current.toggleCrosshair();
      });
    }

    expect(document.body.classList.contains('crosshair-active')).toBe(true);
  });

  it('should remove crosshair-active class when disabled', () => {
    const { result } = renderHook(() => useCrosshair());

    if (result.current.showCrosshair) {
      act(() => {
        result.current.toggleCrosshair();
      });
    }

    expect(document.body.classList.contains('crosshair-active')).toBe(false);
  });

  it('should not update mouse position when crosshair is disabled', () => {
    const { result } = renderHook(() => useCrosshair());

    // Disable crosshair
    if (result.current.showCrosshair) {
      act(() => {
        result.current.toggleCrosshair();
      });
    }

    const initialPos = result.current.mousePos;

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 500,
        clientY: 500,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    // Position should not update
    expect(result.current.mousePos).toEqual(initialPos);
  });

  it('should restore last mouse position when re-enabling crosshair', () => {
    const { result } = renderHook(() => useCrosshair());

    // Move mouse
    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.mousePos).toEqual({ x: 400, y: 300 });

    // Disable crosshair
    act(() => {
      result.current.toggleCrosshair();
    });

    // Enable again
    act(() => {
      result.current.toggleCrosshair();
    });

    // Should restore to last known position
    expect(result.current.mousePos).toEqual({ x: 400, y: 300 });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useCrosshair());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('should remove crosshair class on unmount', () => {
    const { unmount } = renderHook(() => useCrosshair());

    expect(document.body.classList.contains('crosshair-active')).toBe(true);

    unmount();

    expect(document.body.classList.contains('crosshair-active')).toBe(false);
  });

  it('should cancel pending animation frame on unmount', () => {
    const { unmount } = renderHook(() => useCrosshair());

    // Trigger mouse move
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 300, clientY: 300 })
      );
    });

    unmount();

    // cancelAnimationFrame should be called during cleanup
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should use passive event listener for mousemove', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useCrosshair());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function),
      { passive: true }
    );
  });

  it('should handle multiple Escape key presses', () => {
    const { result } = renderHook(() => useCrosshair());

    const states: boolean[] = [];

    for (let i = 0; i < 5; i++) {
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(keydownEvent);
      });
      states.push(result.current.showCrosshair);
    }

    // Should toggle each time
    expect(states).toEqual([false, true, false, true, false]);
  });

  it('should track mouse position accurately across multiple moves', () => {
    const { result } = renderHook(() => useCrosshair());

    const positions = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 300, y: 300 },
      { x: 400, y: 400 },
    ];

    positions.forEach(pos => {
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: pos.x,
          clientY: pos.y,
        });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.mousePos).toEqual(pos);
    });
  });
});
