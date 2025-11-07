import { useState, useEffect } from 'react';

const isTouchDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function useCrosshair() {
  const [showCrosshair, setShowCrosshair] = useState(() => !isTouchDevice());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCrosshair(prev => !prev);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleCrosshair = () => setShowCrosshair(prev => !prev);

  return {
    showCrosshair,
    mousePos,
    toggleCrosshair,
  };
}
