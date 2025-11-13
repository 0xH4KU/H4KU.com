import { useState, useEffect, useRef } from 'react';

const CROSSHAIR_CLASS = 'crosshair-active';

const isTouchDevice = () => {
  /* c8 ignore next */
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const getInitialPosition = () => {
  /* c8 ignore next */
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.round(window.innerWidth / 2),
    y: Math.round(window.innerHeight / 2),
  };
};

export function useCrosshair() {
  const [showCrosshair, setShowCrosshair] = useState(() => !isTouchDevice());
  const [mousePos, setMousePos] = useState(getInitialPosition);
  const latestPointerRef = useRef(mousePos);
  const showCrosshairRef = useRef(showCrosshair);

  useEffect(() => {
    showCrosshairRef.current = showCrosshair;
    if (showCrosshair) {
      setMousePos(latestPointerRef.current);
    }
  }, [showCrosshair]);

  useEffect(() => {
    latestPointerRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    /* c8 ignore next */
    if (typeof document === 'undefined') {
      return undefined;
    }

    const target = document.body;
    /* c8 ignore next */
    if (!target) {
      return undefined;
    }

    if (showCrosshair) {
      target.classList.add(CROSSHAIR_CLASS);
    } else {
      target.classList.remove(CROSSHAIR_CLASS);
    }

    return () => {
      target.classList.remove(CROSSHAIR_CLASS);
    };
  }, [showCrosshair]);

  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined') {
      return;
    }

    let animationFrame: number | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      latestPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (!showCrosshairRef.current) {
        return;
      }

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        setMousePos(latestPointerRef.current);
        animationFrame = null;
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }
      const activeElement =
        typeof document !== 'undefined' ? document.activeElement : null;
      const shouldToggle =
        !activeElement ||
        activeElement === document.body ||
        activeElement === document.documentElement;
      if (!shouldToggle) {
        return;
      }
      setShowCrosshair(prev => !prev);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  const toggleCrosshair = () => setShowCrosshair(prev => !prev);

  return {
    showCrosshair,
    mousePos,
    toggleCrosshair,
  };
}
