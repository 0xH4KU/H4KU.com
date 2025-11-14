import { describe, it, expect } from 'vitest';
import { computeIntegrityHash, verifyIntegrity } from '../integrity';

describe('integrity utilities', () => {
  it('computes deterministic hashes', () => {
    const first = computeIntegrityHash({ foo: 'bar' });
    const second = computeIntegrityHash({ foo: 'bar' });
    expect(first).toBe('7594d08a');
    expect(second).toBe(first);
  });

  it('detects mismatched payloads', () => {
    const reference = computeIntegrityHash({ foo: 'bar' });
    const result = verifyIntegrity({ foo: 'baz' }, reference);
    expect(result.isValid).toBe(false);
    expect(result.expected).toBe(reference);
    expect(result.actual).not.toBe(reference);
  });

  it('confirms valid payloads', () => {
    const payload = { version: 1, items: ['a', 'b'] };
    const checksum = computeIntegrityHash(payload);
    const result = verifyIntegrity(payload, checksum);
    expect(result.isValid).toBe(true);
    expect(result.actual).toBe(checksum);
  });
});
