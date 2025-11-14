const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const serializePayload = (payload: unknown) => JSON.stringify(payload ?? null);

export const computeIntegrityHash = (payload: unknown): string => {
  const input = serializePayload(payload);
  let hash = FNV_OFFSET;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};

export interface IntegrityCheckResult {
  expected: string | null;
  actual: string;
  isValid: boolean;
}

export const verifyIntegrity = (
  payload: unknown,
  expected?: string | null
): IntegrityCheckResult => {
  const actual = computeIntegrityHash(payload);
  const normalizedExpected =
    typeof expected === 'string' && expected.length > 0 ? expected : null;

  return {
    expected: normalizedExpected,
    actual,
    isValid: normalizedExpected !== null && normalizedExpected === actual,
  };
};
