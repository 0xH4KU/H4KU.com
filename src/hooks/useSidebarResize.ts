import { useCallback, useEffect, useRef, useState } from 'react';
import { SIDEBAR_CONFIG } from '@/config/constants';

const KEYBOARD_RESIZE_STEP = 16;
const KEYBOARD_RESIZE_FAST_STEP = 48;

const clampSidebarWidth = (value: number): number =>
  Math.min(Math.max(value, SIDEBAR_CONFIG.MIN_WIDTH), SIDEBAR_CONFIG.MAX_WIDTH);

interface UseSidebarResizeOptions {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

interface UseSidebarResizeResult {
  resizeHandleRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  normalizedWidth: number;
  handleDragStart: (
    event: React.MouseEvent | React.TouchEvent | React.PointerEvent
  ) => void;
  handleResizeKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function useSidebarResize({
  sidebarWidth,
  setSidebarWidth,
}: UseSidebarResizeOptions): UseSidebarResizeResult {
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragWidthRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const normalizedWidth = clampSidebarWidth(sidebarWidth);

  const applySidebarWidth = useCallback(
    (nextWidth: number) => {
      setSidebarWidth(clampSidebarWidth(nextWidth));
    },
    [setSidebarWidth]
  );

  const flushDragWidth = useCallback(() => {
    if (pendingDragWidthRef.current === null) {
      return;
    }
    applySidebarWidth(pendingDragWidthRef.current);
    pendingDragWidthRef.current = null;
  }, [applySidebarWidth]);

  const scheduleDragUpdate = useCallback(
    (nextWidth: number) => {
      pendingDragWidthRef.current = nextWidth;
      if (typeof window === 'undefined') {
        flushDragWidth();
        return;
      }

      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        flushDragWidth();
        dragFrameRef.current = null;
      });
    },
    [flushDragWidth]
  );

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      event.preventDefault();
      setIsDragging(true);
      resizeHandleRef.current?.focus();
    },
    []
  );

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const baseStep = event.shiftKey
        ? KEYBOARD_RESIZE_FAST_STEP
        : KEYBOARD_RESIZE_STEP;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault();
          applySidebarWidth(normalizedWidth - baseStep);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault();
          applySidebarWidth(normalizedWidth + baseStep);
          break;
        case 'Home':
          event.preventDefault();
          applySidebarWidth(SIDEBAR_CONFIG.MIN_WIDTH);
          break;
        case 'End':
          event.preventDefault();
          applySidebarWidth(SIDEBAR_CONFIG.MAX_WIDTH);
          break;
      }
    },
    [applySidebarWidth, normalizedWidth]
  );

  // Handle mouse/touch drag
  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      scheduleDragUpdate(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!event.touches.length) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      scheduleDragUpdate(touch.clientX);
    };

    const stopDrag = () => {
      setIsDragging(false);
      flushDragWidth();
      if (dragFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', stopDrag, { passive: true });
    document.addEventListener('touchcancel', stopDrag, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopDrag);
      document.removeEventListener('touchcancel', stopDrag);
      if (dragFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };
  }, [flushDragWidth, isDragging, scheduleDragUpdate]);

  return {
    resizeHandleRef,
    isDragging,
    normalizedWidth,
    handleDragStart,
    handleResizeKeyDown,
  };
}
