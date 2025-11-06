import { useState, useEffect } from 'react';

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 320;

export function useSidebar(initialWidth = 240) {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setSidebarWidth(current => {
        const clamped = Math.min(
          Math.max(event.clientX, SIDEBAR_MIN_WIDTH),
          SIDEBAR_MAX_WIDTH
        );
        return current === clamped ? current : clamped;
      });
    };

    const stopDrag = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging]);

  const startDrag = () => setIsDragging(true);

  return {
    sidebarWidth,
    isDragging,
    startDrag,
  };
}
