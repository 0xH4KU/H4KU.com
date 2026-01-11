import { describe, it, expect } from 'vitest';
import { isValidEmail, normalizeEmail } from '../emailValidation';

describe('emailValidation', () => {
  it('normalizes and validates email addresses', () => {
    const input = '  user@example.com ';
    expect(normalizeEmail(input)).toBe('user@example.com');
    expect(isValidEmail(input)).toBe(true);
  });

  it('rejects empty or malformed addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('missing-tld@domain')).toBe(false);
  });
});
