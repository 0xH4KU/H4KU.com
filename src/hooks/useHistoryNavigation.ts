import { useState, useCallback, useEffect } from 'react';

const DEFAULT_PATH = '/';

const normalizePath = (value?: string) => {
  if (!value || value === '') {
    return DEFAULT_PATH;
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const getCurrentPath = () => {
  /* c8 ignore next */
  if (typeof window === 'undefined' || !window.location) {
    return DEFAULT_PATH;
  }
  return normalizePath(window.location.pathname);
};

export interface NavigateOptions {
  replace?: boolean;
}

export function useHistoryNavigation() {
  const [pathname, setPathname] = useState<string>(() => getCurrentPath());

  const navigate = useCallback(
    (targetPath: string, options?: NavigateOptions) => {
      const nextPath = normalizePath(targetPath);

      /* c8 ignore next */
      if (typeof window === 'undefined' || !window.history) {
        setPathname(nextPath);
        return;
      }

      const shouldReplace = options?.replace ?? false;
      const currentPath = getCurrentPath();

      if (shouldReplace) {
        window.history.replaceState(null, '', nextPath);
      } else if (currentPath !== nextPath) {
        window.history.pushState(null, '', nextPath);
      }

      if (currentPath !== nextPath) {
        setPathname(nextPath);
      } else if (shouldReplace) {
        setPathname(nextPath);
      }
    },
    []
  );

  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      setPathname(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return { pathname, navigate };
}
