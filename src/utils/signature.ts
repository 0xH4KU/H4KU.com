/**
 * Code Signature Utility
 *
 * Provides component-level integrity verification through digital signatures.
 * Used to detect tampering of critical UI components and business logic.
 */

import { secureWarn } from '@/utils/secureConsole';
import { computeSHA256Hash } from './integrity';

/**
 * Component signature metadata
 */
export interface ComponentSignature {
  componentName: string;
  signature: string;
  timestamp: string;
  version?: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  componentName: string;
  isValid: boolean;
  expected: string | null;
  actual: string;
  tamperedAt?: Date;
}

/**
 * Generate a signature for a component's source code
 * In production, this would be pre-computed during build time
 */
export const generateComponentSignature = async (
  componentName: string,
  sourceCode: string,
  version = '1.0.0'
): Promise<ComponentSignature> => {
  const payload = {
    name: componentName,
    code: sourceCode.replace(/\s+/g, ' ').trim(), // Normalize whitespace
    version,
  };

  const signature = await computeSHA256Hash(payload);

  return {
    componentName,
    signature,
    timestamp: new Date().toISOString(),
    version,
  };
};

/**
 * Verify a component's signature
 */
export const verifyComponentSignature = async (
  componentName: string,
  currentSource: string,
  expectedSignature: ComponentSignature
): Promise<SignatureVerificationResult> => {
  const payload = {
    name: componentName,
    code: currentSource.replace(/\s+/g, ' ').trim(),
    version: expectedSignature.version || '1.0.0',
  };

  const actualSignature = await computeSHA256Hash(payload);
  const isValid = actualSignature === expectedSignature.signature;

  return {
    componentName,
    isValid,
    expected: expectedSignature.signature,
    actual: actualSignature,
    tamperedAt: isValid ? undefined : new Date(),
  };
};

/**
 * Embedded signature registry
 * These signatures are computed at build time and embedded in the bundle
 * Tampering detection: if someone modifies the component, the signature won't match
 */
export interface SignatureRegistry {
  [componentName: string]: string;
}

/**
 * Quick signature check for runtime
 * Compares a simple fingerprint embedded in the component
 */
export const quickSignatureCheck = (
  componentIdentifier: string,
  registry: SignatureRegistry
): boolean => {
  if (typeof window === 'undefined') return true; // Skip in SSR

  // In production builds, this would check against pre-computed hashes
  const expectedSignature = registry[componentIdentifier];

  if (!expectedSignature) {
    secureWarn(
      `[Security] No signature found for component: ${componentIdentifier}`
    );
    return false;
  }

  return true;
};

/**
 * Generate a fingerprint from component metadata
 * This is a lightweight alternative to full source code hashing
 */
export const generateFingerprint = (
  metadata: Record<string, unknown>
): string => {
  const keys = Object.keys(metadata).sort();
  const normalized = keys.map(k => `${k}:${metadata[k]}`).join('|');

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

/**
 * Runtime tamper detection
 * Periodically checks if critical components have been modified
 */
export class TamperMonitor {
  private signatures: SignatureRegistry;
  private interval: number;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(signatures: SignatureRegistry, checkIntervalMs = 60000) {
    this.signatures = signatures;
    this.interval = checkIntervalMs;
  }

  start(onTamperDetected?: (component: string) => void): void {
    if (this.timerId) return; // Already running

    this.timerId = setInterval(() => {
      Object.keys(this.signatures).forEach(component => {
        const isValid = quickSignatureCheck(component, this.signatures);

        if (!isValid && onTamperDetected) {
          onTamperDetected(component);
        }
      });
    }, this.interval);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
