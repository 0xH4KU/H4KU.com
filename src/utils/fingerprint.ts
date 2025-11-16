import { secureLog } from '@/utils/secureConsole';

/**
 * Digital Fingerprint Utility
 *
 * Embeds hidden, traceable markers in the DOM and CSS to identify unauthorized copies.
 * These markers are invisible to users but can be used for legal enforcement.
 */

/**
 * Zero-width characters for steganographic watermarking
 */
const ZERO_WIDTH_CHARS = {
  SPACE: '\u200B', // Zero-width space
  JOINER: '\u200D', // Zero-width joiner
  NON_JOINER: '\u200C', // Zero-width non-joiner
};

/**
 * Encode a string into zero-width characters
 * Creates an invisible watermark that can be embedded in text
 */
export const encodeToZeroWidth = (text: string): string => {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      const binary = code.toString(2).padStart(16, '0');

      return binary
        .split('')
        .map(bit =>
          bit === '1' ? ZERO_WIDTH_CHARS.JOINER : ZERO_WIDTH_CHARS.NON_JOINER
        )
        .join('');
    })
    .join(ZERO_WIDTH_CHARS.SPACE);
};

/**
 * Decode zero-width characters back to original text
 */
export const decodeFromZeroWidth = (encoded: string): string => {
  const segments = encoded.split(ZERO_WIDTH_CHARS.SPACE);

  return segments
    .filter(segment => segment.length > 0)
    .map(segment => {
      const binary = segment
        .split('')
        .map(char => (char === ZERO_WIDTH_CHARS.JOINER ? '1' : '0'))
        .join('');

      return String.fromCharCode(parseInt(binary, 2));
    })
    .join('');
};

/**
 * Generate a unique fingerprint for this build
 */
export interface BuildFingerprint {
  buildId: string;
  timestamp: number;
  version: string;
  environment: 'development' | 'production' | 'test';
  signature?: string;
}

type FingerprintSource = Partial<BuildFingerprint> | null | undefined;

const safeParseFingerprintFromDefine = (): FingerprintSource => {
  if (typeof __BUILD_FINGERPRINT__ === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(__BUILD_FINGERPRINT__);
  } catch {
    return null;
  }
};

const resolveFingerprintFromEnv = (): BuildFingerprint => {
  const defineFingerprint = safeParseFingerprintFromDefine();
  const env = import.meta.env;

  const fallbackEnvironment =
    (env.MODE as BuildFingerprint['environment']) || 'development';

  const buildId =
    env.VITE_BUILD_ID ||
    defineFingerprint?.buildId ||
    (typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev-local');

  const timestampSource =
    env.VITE_BUILD_TIMESTAMP ||
    defineFingerprint?.timestamp?.toString() ||
    (typeof __BUILD_TIMESTAMP__ !== 'undefined'
      ? __BUILD_TIMESTAMP__
      : Date.now().toString());

  const timestamp = Number(timestampSource) || Date.now();

  const version = env.VITE_APP_VERSION || defineFingerprint?.version || '1.0.0';

  const signature =
    env.VITE_BUILD_SIGNATURE ||
    defineFingerprint?.signature ||
    (typeof __BUILD_SIGNATURE__ !== 'undefined' ? __BUILD_SIGNATURE__ : '');

  return {
    buildId,
    timestamp,
    version,
    environment: defineFingerprint?.environment || fallbackEnvironment,
    signature,
  };
};

export const generateBuildFingerprint = (): BuildFingerprint =>
  resolveFingerprintFromEnv();

/**
 * Inject a hidden HTML comment watermark
 * Invisible in the rendered page but present in source code
 */
export const createDOMWatermark = (fingerprint: BuildFingerprint): string => {
  const encoded = encodeToZeroWidth(fingerprint.buildId);
  const timestamp = new Date(fingerprint.timestamp).toISOString();

  return `Build: ${timestamp} | v${fingerprint.version} ${encoded}`;
};

/**
 * Inject watermark into DOM
 * Should be called on app initialization
 */
export const injectDOMWatermark = (fingerprint: BuildFingerprint): void => {
  if (typeof document === 'undefined') return; // Skip in SSR

  const watermark = createDOMWatermark(fingerprint);
  const comment = document.createComment(watermark);

  // Inject at the beginning of the body
  document.body?.insertBefore(comment, document.body.firstChild);
  document.body?.setAttribute('data-build-id', fingerprint.buildId);
  document.body?.setAttribute(
    'data-fingerprint',
    encodeToZeroWidth(fingerprint.signature || fingerprint.buildId)
  );

  // Also inject a hidden meta tag
  const meta = document.createElement('meta');
  meta.name = 'build-id';
  meta.content = fingerprint.buildId;
  meta.setAttribute('data-timestamp', fingerprint.timestamp.toString());
  if (fingerprint.signature) {
    meta.setAttribute('data-signature', fingerprint.signature);
  }
  document.head?.appendChild(meta);
};

/**
 * CSS Fingerprint Generator
 * Creates unique CSS property combinations that serve as fingerprints
 */
export interface CSSFingerprint {
  animationDuration: string;
  animationDelay: string;
  transitionDuration: string;
}

export const generateCSSFingerprint = (seed: string): CSSFingerprint => {
  // Generate unique but valid CSS timing values based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const chr = seed.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }

  const duration = 3000 + (Math.abs(hash) % 1000);
  const delay = Math.abs(hash >> 8) % 500;
  const transition = 200 + (Math.abs(hash >> 16) % 300);

  return {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    transitionDuration: `${transition}ms`,
  };
};

/**
 * Create a CSS custom property fingerprint
 * Injects unique timing values into CSS variables
 */
export const injectCSSFingerprint = (fingerprint: BuildFingerprint): void => {
  if (typeof document === 'undefined') return;

  const cssFingerprint = generateCSSFingerprint(fingerprint.buildId);

  const style = document.createElement('style');
  style.setAttribute('data-fingerprint', 'true');
  style.textContent = `
    :root {
      --fp-anim-duration: ${cssFingerprint.animationDuration};
      --fp-anim-delay: ${cssFingerprint.animationDelay};
      --fp-transition: ${cssFingerprint.transitionDuration};
    }
  `;

  document.head?.appendChild(style);
};

/**
 * Canvas Fingerprinting
 * Creates a unique visual fingerprint (invisible pixel patterns)
 */
export const generateCanvasFingerprint = (text: string): string => {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw text with specific styling
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText(text, 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText(text, 4, 17);

  return canvas.toDataURL();
};

/**
 * Extract fingerprint from current page
 * Used for verification or forensic analysis
 */
export const extractFingerprint = (): Partial<BuildFingerprint> | null => {
  if (typeof document === 'undefined') return null;

  const meta = document.querySelector('meta[name="build-id"]');
  if (!meta) return null;

  const buildId = meta.getAttribute('content');
  const timestampStr = meta.getAttribute('data-timestamp');
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : 0;
  const signature = meta.getAttribute('data-signature') || undefined;

  return {
    buildId: buildId || undefined,
    timestamp: timestamp || undefined,
    signature,
  };
};

/**
 * Full fingerprint injection
 * Injects all types of fingerprints at once
 */
export const injectAllFingerprints = (
  fingerprint?: BuildFingerprint
): BuildFingerprint => {
  const fp = fingerprint || generateBuildFingerprint();

  injectDOMWatermark(fp);
  injectCSSFingerprint(fp);

  if (typeof window !== 'undefined') {
    window.__LUM_BUILD_FINGERPRINT__ = fp;
  }

  if (import.meta.env.PROD) {
    secureLog(
      `%c🔒 Protected Build ${fp.buildId} (${fp.version})`,
      'color: #888; font-size: 10px'
    );
  }

  return fp;
};

export const getActiveFingerprint = (): BuildFingerprint => {
  if (typeof window !== 'undefined' && window.__LUM_BUILD_FINGERPRINT__) {
    return window.__LUM_BUILD_FINGERPRINT__;
  }
  return generateBuildFingerprint();
};
