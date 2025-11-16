import { useEffect, useRef, useState } from 'react';
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
  const widthRef = useRef(sidebarWidth);

  useEffect(() => {
    widthRef.current = sidebarWidth;
  }, [sidebarWidth]);

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
      setStoredWidth(widthRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging, setStoredWidth]);

  const startDrag = () => setIsDragging(true);

  return {
    sidebarWidth,
    isDragging,
    startDrag,
  };
}
