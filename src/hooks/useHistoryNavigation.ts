import { useState, useCallback, useEffect } from 'react';

const DEFAULT_PATH = '/';

// Normalize BASE_URL (e.g., "/my-app/") into a leading-slash, no-trailing-slash segment
const getBasePath = () => {
  const raw =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.BASE_URL as string | undefined)) ||
    '/';
  if (!raw || raw === '/') return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

const normalizePath = (value?: string) => {
  if (!value || value === '') {
    return DEFAULT_PATH;
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const stripBasePath = (pathname: string, basePath: string) => {
  if (!basePath) return pathname;
  return pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname;
};

const applyBasePath = (pathname: string, basePath: string) => {
  if (!basePath) return pathname;
  if (pathname === '/') return `${basePath}/`;
  return `${basePath}${pathname}`;
};

const getCurrentPath = () => {
  /* c8 ignore next */
  if (typeof window === 'undefined' || !window.location) {
    return DEFAULT_PATH;
  }
  const basePath = getBasePath();
  const relative = stripBasePath(window.location.pathname, basePath);
  return normalizePath(relative);
};

export interface NavigateOptions {
  replace?: boolean;
}

export function useHistoryNavigation() {
  const basePath = getBasePath();
  const [pathname, setPathname] = useState<string>(() => getCurrentPath());

  const navigate = useCallback(
    (targetPath: string, options?: NavigateOptions) => {
      const nextPath = normalizePath(targetPath);
      const resolvedPath = applyBasePath(nextPath, basePath);

      /* c8 ignore next */
      if (typeof window === 'undefined' || !window.history) {
        setPathname(nextPath);
        return;
      }

      const shouldReplace = options?.replace ?? false;
      const currentPath = getCurrentPath();

      if (shouldReplace) {
        window.history.replaceState(null, '', resolvedPath);
      } else if (currentPath !== nextPath) {
        window.history.pushState(null, '', resolvedPath);
      }

      if (currentPath !== nextPath) {
        setPathname(nextPath);
      } else if (shouldReplace) {
        setPathname(nextPath);
      }
    },
    [basePath]
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
