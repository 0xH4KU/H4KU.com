/**
 * Utilities for safely handling user-provided URLs (e.g., CMS/social links).
 */

export interface SafeUrlInfo {
  href: string;
  isExternal: boolean;
  isMailto: boolean;
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

const MAILTO_PATTERN =
  /^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

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
