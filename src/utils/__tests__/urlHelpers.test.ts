import { describe, it, expect } from 'vitest';
import { getSafeUrl, buildAppUrl } from '../urlHelpers';

describe('urlHelpers', () => {
  it('blocks unsafe protocols like javascript:', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeUrl('data:text/html;base64,abcd')).toBeNull();
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
});
