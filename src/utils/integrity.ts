/**
 * FNV-1a (Fowler-Noll-Vo) Hash Constants
 *
 * FNV-1a is a non-cryptographic hash function known for its simplicity and speed.
 * It's used here for quick integrity checks where cryptographic security isn't required.
 *
 * @see https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
 */
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const serializePayload = (payload: unknown) => JSON.stringify(payload ?? null);

const TEXT_ENCODER =
  typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

const encodeUtf8Fallback = (value: string): Uint8Array => {
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];

  for (let i = 0; i < encoded.length; i += 1) {
    const char = encoded[i];
    if (char === '%') {
      const hex = encoded.substring(i + 1, i + 3);
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(char.charCodeAt(0));
    }
  }

  return Uint8Array.from(bytes);
};

const toUtf8Bytes = (value: string): Uint8Array => {
  if (TEXT_ENCODER) {
    return TEXT_ENCODER.encode(value);
  }
  return encodeUtf8Fallback(value);
};

/**
 * SHA-256 Initial Hash Values
 *
 * These are the first 32 bits of the fractional parts of the square roots
 * of the first 8 prime numbers (2, 3, 5, 7, 11, 13, 17, 19).
 *
 * @see FIPS 180-4 Section 5.3.3
 */
const SHA256_INITIAL: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

/**
 * SHA-256 Round Constants
 *
 * These are the first 32 bits of the fractional parts of the cube roots
 * of the first 64 prime numbers (2..311).
 *
 * @see FIPS 180-4 Section 4.2.2
 */
const SHA256_CONSTANTS: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (value: number, amount: number) =>
  (value >>> amount) | (value << (32 - amount));

const padMessage = (message: Uint8Array): Uint8Array => {
  const length = message.length;
  const bitLength = length * 8;
  const remainder = (length + 1) % 64;
  const padding = remainder <= 56 ? 56 - remainder : 64 - remainder + 56;
  const totalLength = length + 1 + padding + 8;

  const result = new Uint8Array(totalLength);
  result.set(message);
  result[length] = 0x80;

  const view = new DataView(result.buffer);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  view.setUint32(totalLength - 8, high);
  view.setUint32(totalLength - 4, low);

  return result;
};

const sha256Internal = (input: string): string => {
  const data = padMessage(toUtf8Bytes(input));
  const hash = new Uint32Array(SHA256_INITIAL);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      const index = offset + i * 4;
      w[i] =
        (data[index] << 24) |
        (data[index + 1] << 16) |
        (data[index + 2] << 8) |
        data[index + 3];
    }

    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 =
        (((((h + s1) | 0) + ((ch + SHA256_CONSTANTS[i]) | 0)) | 0) + w[i]) | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return Array.from(hash)
    .map(value => (value >>> 0).toString(16).padStart(8, '0'))
    .join('');
};

/**
 * FNV-1a hash (legacy, kept for backward compatibility)
 * Fast but not cryptographically secure
 */
export const computeIntegrityHash = (payload: unknown): string => {
  const input = serializePayload(payload);
  let hash = FNV_OFFSET;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};

/**
 * SHA-256 hash using Web Crypto API (async, hardware-accelerated)
 * Falls back to synchronous implementation if crypto.subtle is unavailable
 */
export const computeSHA256Hash = async (payload: unknown): Promise<string> => {
  const input = serializePayload(payload);

  // Use Web Crypto API when available (browser, modern Node.js)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback to synchronous implementation
  return sha256Internal(input);
};

/**
 * SHA-256 hash (synchronous fallback)
 * Use computeSHA256Hash for better performance when async is acceptable
 */
export const computeSHA256HashSync = (payload: unknown): string => {
  const input = serializePayload(payload);
  return sha256Internal(input);
};

export interface IntegrityCheckResult {
  expected: string | null;
  actual: string;
  isValid: boolean;
  algorithm: 'fnv1a' | 'sha256';
}

const normalizeExpected = (expected?: string | null): string | null =>
  typeof expected === 'string' && expected.length > 0 ? expected : null;

export const verifyIntegrity = (
  payload: unknown,
  expected?: string | null
): IntegrityCheckResult => {
  const normalizedExpected = normalizeExpected(expected);
  const actual = computeIntegrityHash(payload);

  return {
    expected: normalizedExpected,
    actual,
    isValid: normalizedExpected !== null && normalizedExpected === actual,
    algorithm: 'fnv1a',
  };
};

/**
 * Async SHA-256 verification (uses Web Crypto where available to avoid blocking)
 */
export const verifyIntegritySHA256 = async (
  payload: unknown,
  expected?: string | null
): Promise<IntegrityCheckResult> => {
  const normalizedExpected = normalizeExpected(expected);
  const actual = await computeSHA256Hash(payload);

  return {
    expected: normalizedExpected,
    actual,
    isValid: normalizedExpected !== null && normalizedExpected === actual,
    algorithm: 'sha256',
  };
};

/**
 * Synchronous SHA-256 verification (fallback)
 * Prefer verifyIntegritySHA256 for non-blocking validation.
 */
export const verifyIntegritySHA256Sync = (
  payload: unknown,
  expected?: string | null
): IntegrityCheckResult => {
  const normalizedExpected = normalizeExpected(expected);
  const actual = computeSHA256HashSync(payload);

  return {
    expected: normalizedExpected,
    actual,
    isValid: normalizedExpected !== null && normalizedExpected === actual,
    algorithm: 'sha256',
  };
};

export interface DualIntegrityCheckResult {
  fnv1a: IntegrityCheckResult;
  sha256: IntegrityCheckResult;
  isFullyValid: boolean;
}

/**
 * Dual-algorithm verification (both FNV-1a and SHA-256)
 * Provides backward compatibility while enforcing stronger security
 */
export const verifyIntegrityDual = async (
  payload: unknown,
  expectedFNV?: string | null,
  expectedSHA256?: string | null
): Promise<DualIntegrityCheckResult> => {
  const [fnv1aResult, sha256Result] = await Promise.all([
    Promise.resolve(verifyIntegrity(payload, expectedFNV)),
    verifyIntegritySHA256(payload, expectedSHA256),
  ]);

  return {
    fnv1a: fnv1aResult,
    sha256: sha256Result,
    isFullyValid: fnv1aResult.isValid && sha256Result.isValid,
  };
};

/**
 * Synchronous dual verification (falls back to sync SHA-256)
 */
export const verifyIntegrityDualSync = (
  payload: unknown,
  expectedFNV?: string | null,
  expectedSHA256?: string | null
): DualIntegrityCheckResult => {
  const fnv1aResult = verifyIntegrity(payload, expectedFNV);
  const sha256Result = verifyIntegritySHA256Sync(payload, expectedSHA256);

  return {
    fnv1a: fnv1aResult,
    sha256: sha256Result,
    isFullyValid: fnv1aResult.isValid && sha256Result.isValid,
  };
};
