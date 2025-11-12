import { describe, it, expect } from 'vitest';
import { getSafeUrl } from '../urlHelpers';

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
});
