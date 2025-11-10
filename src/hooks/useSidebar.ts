import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SIDEBAR_CONFIG, STORAGE_KEYS } from '@/config/constants';

export function useSidebar(
  initialWidth: number = SIDEBAR_CONFIG.DEFAULT_WIDTH
) {
  const [storedWidth, setStoredWidth] = useLocalStorage<number>(
    STORAGE_KEYS.SIDEBAR_WIDTH,
    initialWidth
  );
  const [sidebarWidth, setSidebarWidth] = useState<number>(storedWidth);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const clamped = Math.min(
        Math.max(event.clientX, SIDEBAR_CONFIG.MIN_WIDTH),
        SIDEBAR_CONFIG.MAX_WIDTH
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
