import { useState, useEffect } from 'react';
import { DEBOUNCE_DELAYS } from '@/config/constants';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function handleResize() {
      // Clear existing timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Debounce the resize handler
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        timeoutId = null;
      }, DEBOUNCE_DELAYS.RESIZE);
    }

    // Set initial size immediately (no debounce)
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return windowSize;
}
