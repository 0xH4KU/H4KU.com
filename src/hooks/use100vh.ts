import { useEffect } from 'react';

type PageShowEvent = Event & { persisted?: boolean };

export function use100vh() {
  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const setVh = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--vh',
        `${viewportHeight * 0.01}px`
      );
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
    window.visualViewport?.addEventListener('scroll', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      window.removeEventListener('pageshow', handlePageShow);
      window.visualViewport?.removeEventListener('resize', setVh);
      window.visualViewport?.removeEventListener('scroll', setVh);
    };
  }, []);
}
