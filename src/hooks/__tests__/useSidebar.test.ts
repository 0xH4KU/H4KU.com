import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSidebar } from '../useSidebar';
import { SIDEBAR_CONFIG } from '@/config/constants';

describe('useSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default width', () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.DEFAULT_WIDTH);
    expect(result.current.isDragging).toBe(false);
  });

  it('should initialize with custom width', () => {
    const customWidth = 300;
    const { result } = renderHook(() => useSidebar(customWidth));

    expect(result.current.sidebarWidth).toBe(customWidth);
  });

  it('should restore width from localStorage', () => {
    const storedWidth = 280;
    localStorage.setItem('lum.bio.sidebar.width', JSON.stringify(storedWidth));

    const { result } = renderHook(() => useSidebar());

    expect(result.current.sidebarWidth).toBe(storedWidth);
  });

  it('should start dragging', () => {
    const { result } = renderHook(() => useSidebar());

    expect(result.current.isDragging).toBe(false);

    act(() => {
      result.current.startDrag();
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('should update width during drag', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    // Simulate mouse move
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 300,
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.sidebarWidth).toBe(300);
  });

  it('should clamp width to MIN_WIDTH', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    // Try to drag below minimum
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 100, // Below MIN_WIDTH (200)
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.MIN_WIDTH);
  });

  it('should clamp width to MAX_WIDTH', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    // Try to drag above maximum
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 500, // Above MAX_WIDTH (340)
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.MAX_WIDTH);
  });

  it('should stop dragging on mouse up', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    expect(result.current.isDragging).toBe(true);

    // Move to new position
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 280,
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // Release mouse
    const mouseUpEvent = new MouseEvent('mouseup');

    act(() => {
      document.dispatchEvent(mouseUpEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.sidebarWidth).toBe(280);
  });

  it('should save width to localStorage on drag end', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    // Drag to new position
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 280,
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // End drag
    const mouseUpEvent = new MouseEvent('mouseup');

    act(() => {
      document.dispatchEvent(mouseUpEvent);
    });

    // Check localStorage
    const stored = localStorage.getItem('lum.bio.sidebar.width');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toBe(280);
  });

  it('should not respond to mouse move when not dragging', () => {
    const { result } = renderHook(() => useSidebar());

    const initialWidth = result.current.sidebarWidth;

    // Simulate mouse move without starting drag
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 300,
    });

    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // Width should not change
    expect(result.current.sidebarWidth).toBe(initialWidth);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { result, unmount } = renderHook(() => useSidebar());

    // Start dragging to attach listeners
    act(() => {
      result.current.startDrag();
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function)
    );
  });

  it('should handle multiple drag sessions', () => {
    const { result } = renderHook(() => useSidebar());

    // First drag
    act(() => {
      result.current.startDrag();
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }));
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.sidebarWidth).toBe(250);

    // Second drag
    act(() => {
      result.current.startDrag();
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }));
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.sidebarWidth).toBe(300);
  });

  it('should maintain width within bounds during continuous drag', () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.startDrag();
    });

    const positions = [150, 180, 220, 280, 320, 360, 400];

    positions.forEach(clientX => {
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX }));
      });

      const { sidebarWidth } = result.current;

      expect(sidebarWidth).toBeGreaterThanOrEqual(SIDEBAR_CONFIG.MIN_WIDTH);
      expect(sidebarWidth).toBeLessThanOrEqual(SIDEBAR_CONFIG.MAX_WIDTH);
    });
  });

  it('should use localStorage value over initial value', () => {
    const initialValue = 250;
    const storedValue = 300;

    localStorage.setItem('lum.bio.sidebar.width', JSON.stringify(storedValue));

    const { result } = renderHook(() => useSidebar(initialValue));

    expect(result.current.sidebarWidth).toBe(storedValue);
  });
});
