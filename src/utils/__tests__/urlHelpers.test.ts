import { describe, it, expect } from 'vitest';
import {
  getSafeUrl,
  buildAppUrl,
  buildFolderUrl,
  buildPageUrl,
} from '../urlHelpers';

describe('urlHelpers', () => {
  it('blocks unsafe protocols like javascript:', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeUrl('data:text/html;base64,abcd')).toBeNull();
  });

  it('returns null when URL parsing fails', () => {
    expect(getSafeUrl('::::')).toBeNull();
  });

  it('allows mailto and relative URLs', () => {
    expect(getSafeUrl('mailto:test@example.com')).toMatchObject({
      href: 'mailto:test@example.com',
      isMailto: true,
      isExternal: false,
    });
    expect(getSafeUrl('/path')?.isExternal).toBe(false);
  });

  it('marks http/https as external', () => {
    expect(getSafeUrl('https://example.com')).toMatchObject({
      isExternal: true,
      isMailto: false,
    });
  });

  it('buildAppUrl respects leading slash', () => {
    const result = buildAppUrl('/folder/abc');
    expect(result).toContain('/folder/abc');
  });

  it('uses BASE_URL when provided and trims trailing slash', () => {
    const originalBase = import.meta.env.BASE_URL;
    const env = import.meta.env as Record<string, string | undefined>;
    env.BASE_URL = '/demo/';

    try {
      const result = buildAppUrl('work');
      expect(result).toContain('/demo/work');
    } finally {
      env.BASE_URL = originalBase;
    }
  });

  it('falls back when URL construction throws', () => {
    const originalURL = URL;
    const originalBase = import.meta.env.BASE_URL;

    const globalOverride = globalThis as typeof globalThis & {
      URL: typeof URL;
    };

    globalOverride.URL = class FailingURL {
      constructor() {
        throw new TypeError('fail');
      }
    } as unknown as typeof URL;

    const env = import.meta.env as Record<string, string | undefined>;
    env.BASE_URL = '/fallback/';
    try {
      const result = buildAppUrl('path');
      expect(result.endsWith('/fallback/path')).toBe(true);
    } finally {
      globalOverride.URL = originalURL;
      const envReset = import.meta.env as Record<string, string | undefined>;
      envReset.BASE_URL = originalBase;
    }
  });

  it('builds folder and page urls correctly', () => {
    expect(buildFolderUrl([])).toContain('/');
    expect(buildFolderUrl(['a', 'b'])).toContain('/folder/a/b');
    expect(buildPageUrl('123')).toMatch(/\/page\/123$/);
  });
});
