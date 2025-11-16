import { describe, it, expect, vi } from 'vitest';
import {
  computeIntegrityHash,
  computeSHA256Hash,
  computeSHA256HashSync,
  verifyIntegrity,
  verifyIntegritySHA256,
  verifyIntegrityDual,
} from '../integrity';

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

  it('handles missing expected checksum gracefully', () => {
    const payload = { foo: 'bar' };
    const result = verifyIntegrity(payload, undefined);
    expect(result.expected).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.actual).toBe(computeIntegrityHash(payload));
  });

  it('computes SHA-256 hashes deterministically', () => {
    const payload = { foo: 'secure' };
    const hashA = computeSHA256HashSync(payload);
    const hashB = computeSHA256HashSync(payload);
    expect(hashA).toHaveLength(64);
    expect(hashA).toBe(hashB);
  });

  it('verifies SHA-256 payloads', () => {
    const payload = { foo: 'secure' };
    const checksum = computeSHA256HashSync(payload);
    const result = verifyIntegritySHA256(payload, checksum);
    expect(result.algorithm).toBe('sha256');
    expect(result.isValid).toBe(true);
  });

  it('reports invalid SHA-256 payloads', () => {
    const payload = { foo: 'secure' };
    const checksum = computeSHA256HashSync(payload);
    const tampered = verifyIntegritySHA256({ foo: 'tampered' }, checksum);
    expect(tampered.isValid).toBe(false);
    expect(tampered.algorithm).toBe('sha256');
  });

  it('combines both algorithms in dual verification', () => {
    const payload = { value: 'dual' };
    const dual = verifyIntegrityDual(
      payload,
      computeIntegrityHash(payload),
      computeSHA256HashSync(payload)
    );
    expect(dual.isFullyValid).toBe(true);
    expect(dual.fnv1a.isValid).toBe(true);
    expect(dual.sha256.isValid).toBe(true);
  });

  it('provides an async SHA-256 hash helper', async () => {
    const payload = { note: 'async' };
    await expect(computeSHA256Hash(payload)).resolves.toBe(
      computeSHA256HashSync(payload)
    );
  });

  it('uses the UTF-8 fallback when TextEncoder is unavailable', async () => {
    const originalEncoder = globalThis.TextEncoder;
    vi.resetModules();
    try {
      (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder =
        undefined;

      const module = await import('../integrity');
      const payload = { text: 'unicode 🌌 payload' };
      const hash = module.computeSHA256HashSync(payload);
      expect(hash).toHaveLength(64);

      const result = module.verifyIntegritySHA256(payload, hash);
      expect(result.isValid).toBe(true);
    } finally {
      (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder =
        originalEncoder;
      vi.resetModules();
    }
  });
});
