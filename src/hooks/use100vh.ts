import { useEffect } from 'react';

type PageShowEvent = Event & { persisted?: boolean };

export function use100vh() {
  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let scrollTimeout: number | null = null;

    const setVh = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--vh',
        `${viewportHeight * 0.01}px`
      );
    };

    // Throttled version for scroll events to improve performance
    const setVhThrottled = () => {
      if (scrollTimeout !== null) {
        return;
      }
      scrollTimeout = window.setTimeout(() => {
        setVh();
        scrollTimeout = null;
      }, 100);
    };

    const handlePageShow = (event: PageShowEvent) => {
      if (event.persisted) {
        setVh();
      }
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    window.addEventListener('pageshow', handlePageShow);
    window.visualViewport?.addEventListener('resize', setVh);
    window.visualViewport?.addEventListener('scroll', setVhThrottled);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      window.removeEventListener('pageshow', handlePageShow);
      window.visualViewport?.removeEventListener('resize', setVh);
      window.visualViewport?.removeEventListener('scroll', setVhThrottled);
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);
}
