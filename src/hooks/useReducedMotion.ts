import { useEffect, useState } from 'react';

/**
 * Keeps motion disabled until after React hydrates so the first paint
 * can happen without any intro animations delaying LCP/FCP on slower devices.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (
      event: MediaQueryList | MediaQueryListEvent
    ): void => {
      setPrefersReducedMotion(event.matches);
    };

    // Sync to the real preference immediately after hydration
    updatePreference(mediaQuery);

    const listener = (event: MediaQueryListEvent) => updatePreference(event);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
