import { useEffect } from 'react';

export function use100vh() {
  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);

    return () => window.removeEventListener('resize', setVh);
  }, []);
}
