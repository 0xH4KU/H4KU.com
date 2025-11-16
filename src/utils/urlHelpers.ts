/**
 * Utilities for safely handling user-provided URLs (e.g., CMS/social links).
 */

export interface SafeUrlInfo {
  href: string;
  isExternal: boolean;
  isMailto: boolean;
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

const MAILTO_PATTERN = /^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * Returns metadata for a URL only if it uses a safe scheme.
 * Disallows javascript/data/etc to avoid XSS via CMS content.
 */
export function getSafeUrl(
  rawValue: string | null | undefined
): SafeUrlInfo | null {
  const value = rawValue?.trim();

  if (!value || value === '#') {
    return null;
  }

  if (MAILTO_PATTERN.test(value)) {
    return { href: value, isExternal: false, isMailto: true };
  }

  if (value.startsWith('/')) {
    return { href: value, isExternal: false, isMailto: false };
  }

  try {
    const parsed = new URL(value);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return {
      href: parsed.toString(),
      isExternal: true,
      isMailto: false,
    };
  } catch {
    return null;
  }
}

const DEFAULT_APP_ORIGIN = 'https://lum.bio';

const getAppOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_APP_ORIGIN;
};

const getBasePath = () => {
  const rawBase = (import.meta.env.BASE_URL ?? '/') as string;
  if (rawBase === '/') {
    return '';
  }
  return rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
};

const ensureLeadingSlash = (pathname: string) =>
  pathname.startsWith('/') ? pathname : `/${pathname}`;

export const buildAppUrl = (pathname: string) => {
  const basePath = getBasePath();
  const normalizedPath = ensureLeadingSlash(pathname || '/');
  const relativePath = `${basePath}${normalizedPath}` || '/';
  const origin = getAppOrigin();

  try {
    return new URL(relativePath || '/', origin).toString();
  } catch {
    const sanitizedOrigin = origin.replace(/\/$/, '');
    return `${sanitizedOrigin}${relativePath || '/'}`;
  }
};

export const buildFolderUrl = (path: string[]) => {
  if (!path.length) {
    return buildAppUrl('/');
  }
  const folderPath = path.join('/');
  return buildAppUrl(`/folder/${folderPath}`);
};

export const buildPageUrl = (pageId: string) => buildAppUrl(`/page/${pageId}`);
