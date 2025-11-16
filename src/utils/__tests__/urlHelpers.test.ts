import { beforeEach, afterAll, describe, it, expect } from 'vitest';
import {
  buildAppUrl,
  buildFolderUrl,
  buildPageUrl,
  getSafeUrl,
} from '../urlHelpers';

const setBaseUrl = (value: string) => {
  (import.meta.env as { BASE_URL: string }).BASE_URL = value;
};

const originalBaseUrl = import.meta.env.BASE_URL;
const OriginalURL = URL;
const getOrigin = () =>
  (typeof window !== 'undefined' && window.location?.origin) ||
  'http://localhost';

beforeEach(() => {
  setBaseUrl('/');
  globalThis.URL = OriginalURL;
});

afterAll(() => {
  setBaseUrl(originalBaseUrl);
  globalThis.URL = OriginalURL;
});

describe('getSafeUrl', () => {
  it('rejects empty or placeholder values', () => {
    expect(getSafeUrl('')).toBeNull();
    expect(getSafeUrl('#')).toBeNull();
    expect(getSafeUrl(undefined)).toBeNull();
  });

  it('rejects dangerous protocols', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeUrl('data:text/html,hi')).toBeNull();
  });

  it('allows mailto links with valid addresses', () => {
    const result = getSafeUrl('mailto:test@example.com');
    expect(result).toMatchObject({
      href: 'mailto:test@example.com',
      isMailto: true,
      isExternal: false,
    });
  });

  it('allows relative paths', () => {
    const result = getSafeUrl('/folder/2025');
    expect(result).toMatchObject({
      href: '/folder/2025',
      isExternal: false,
      isMailto: false,
    });
  });

  it('allows https links and marks them as external', () => {
    const result = getSafeUrl('https://example.com/hello');
    expect(result).toMatchObject({
      href: 'https://example.com/hello',
      isExternal: true,
      isMailto: false,
    });
  });

  it('rejects malformed urls that cannot be parsed', () => {
    expect(getSafeUrl('notaurl')).toBeNull();
  });
});

describe('buildAppUrl', () => {
  it('builds an absolute url relative to the app origin', () => {
    const origin = getOrigin();
    expect(buildAppUrl('folder/demo')).toBe(`${origin}/folder/demo`);
  });

  it('respects custom Vite base paths', () => {
    setBaseUrl('/portfolio/');
    const origin = getOrigin();
    expect(buildAppUrl('/folder/featured')).toBe(
      `${origin}/portfolio/folder/featured`
    );
  });

  it('falls back to manual concatenation if URL construction fails', () => {
    const origin = getOrigin();
    const originalUrlCtor = OriginalURL;
    class ThrowingURL {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(..._args: ConstructorParameters<typeof URL>) {
        throw new Error('fail');
      }
    }
    globalThis.URL = ThrowingURL as unknown as typeof URL;
    expect(buildAppUrl('/folder/fallback')).toBe(`${origin}/folder/fallback`);
    globalThis.URL = originalUrlCtor;
  });
});

describe('buildFolderUrl', () => {
  it('returns the root url when the path is empty', () => {
    const origin = getOrigin();
    expect(buildFolderUrl([])).toBe(`${origin}/`);
  });

  it('builds nested folder urls', () => {
    const origin = getOrigin();
    expect(buildFolderUrl(['featured', '2025'])).toBe(
      `${origin}/folder/featured/2025`
    );
  });
});

describe('buildPageUrl', () => {
  it('builds urls for pages', () => {
    const origin = getOrigin();
    expect(buildPageUrl('contact')).toBe(`${origin}/page/contact`);
  });
});
