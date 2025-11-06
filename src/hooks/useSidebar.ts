import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 320;
const DEFAULT_WIDTH = 240;

export function useSidebar(initialWidth = DEFAULT_WIDTH) {
  const [storedWidth, setStoredWidth] = useLocalStorage(
    'sidebar-width',
    initialWidth
  );
  const [sidebarWidth, setSidebarWidth] = useState(storedWidth);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const clamped = Math.min(
        Math.max(event.clientX, SIDEBAR_MIN_WIDTH),
        SIDEBAR_MAX_WIDTH
      );
      setSidebarWidth(clamped);
    };

    const stopDrag = () => {
      setIsDragging(false);
      setStoredWidth(sidebarWidth);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging, sidebarWidth, setStoredWidth]);

  const startDrag = () => setIsDragging(true);

  return {
    sidebarWidth,
    isDragging,
    startDrag,
  };
}
