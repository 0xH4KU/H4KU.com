/**
 * Shared middleware for contact API endpoints
 *
 * Provides:
 * - Turnstile human verification (Cloudflare's free CAPTCHA alternative)
 * - CORS with allowed domains list
 * - Request body size limits
 * - Request timeout via AbortSignal
 * - Email masking for logs
 * - Secure reference ID generation
 */

import { isValidEmail } from '../../src/shared/emailValidation';

// =============================================================================
// Configuration
// =============================================================================

/** Maximum request body size in bytes (32KB) */
export const MAX_BODY_SIZE = 32 * 1024;

/** External API timeout in milliseconds */
export const API_TIMEOUT_MS = 10000;

/** Turnstile verification endpoint */
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Allowed CORS origins */
export const ALLOWED_ORIGINS = [
  'https://h4ku.com',
  'https://www.h4ku.com',
  // Cloudflare Pages preview deployments
  /^https:\/\/[a-z0-9-]+\.h4ku-com\.pages\.dev$/,
  // Local development
  'http://localhost:5173',
  'http://localhost:4173',
];

// =============================================================================
// Types
// =============================================================================

export interface MiddlewareEnv {
  TURNSTILE_SECRET_KEY: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

// =============================================================================
// Turnstile Verification
// =============================================================================

/**
 * Verify a Turnstile token with Cloudflare's API
 * @returns true if verification passed, false otherwise
 */
export async function verifyTurnstile(
  token: string,
  clientIp: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: 'Missing verification token' };
  }

  if (!secretKey) {
    console.error('Missing TURNSTILE_SECRET_KEY');
    return { success: false, error: 'Server configuration error' };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: clientIp,
      }),
    });

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      const errorCodes = result['error-codes']?.join(', ') || 'unknown';
      console.warn(`Turnstile verification failed: ${errorCodes}`);
      return { success: false, error: 'Human verification failed. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Verification service unavailable' };
  }
}

// =============================================================================
// CORS Handling
// =============================================================================

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  return ALLOWED_ORIGINS.some((allowed) => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    }
    // RegExp
    return allowed.test(origin);
  });
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0] as string;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Vary': 'Origin',
  };
}

/**
 * Create a CORS preflight response
 */
export function corsPreflightResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

// =============================================================================
// Request Body Size Validation
// =============================================================================

/**
 * Check if the request body size is within limits
 * @returns error message if too large, null if OK
 */
export function checkBodySize(request: Request): string | null {
  const contentLength = request.headers.get('Content-Length');

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > MAX_BODY_SIZE) {
      return `Request body too large. Maximum size is ${MAX_BODY_SIZE / 1024}KB`;
    }
  }

  return null;
}

// =============================================================================
// Timeout Handling
// =============================================================================

/**
 * Create an AbortController with timeout
 */
export function createTimeoutController(ms: number = API_TIMEOUT_MS): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  return {
    controller,
    timeoutId,
    clear: () => clearTimeout(timeoutId),
  };
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const { controller, clear } = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clear();
  }
}

// =============================================================================
// Email Masking for Logs
// =============================================================================

/**
 * Mask an email address for logging
 * e.g., "user@example.com" -> "us***@ex***.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return '***';

  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex + 1);
  const dotIndex = domainPart.lastIndexOf('.');

  const maskedLocal =
    localPart.length <= 2 ? '***' : localPart.substring(0, 2) + '***';

  let maskedDomain: string;
  if (dotIndex === -1) {
    maskedDomain = domainPart.length <= 2 ? '***' : domainPart.substring(0, 2) + '***';
  } else {
    const domainName = domainPart.substring(0, dotIndex);
    const tld = domainPart.substring(dotIndex);
    maskedDomain =
      (domainName.length <= 2 ? '***' : domainName.substring(0, 2) + '***') + tld;
  }

  return `${maskedLocal}@${maskedDomain}`;
}

// =============================================================================
// Secure Reference ID Generation
// =============================================================================

/**
 * Generate a cryptographically secure reference ID
 */
export function generateSecureReferenceId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  const random = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 8);
  return `HAKU-${timestamp}-${random}`.toUpperCase();
}

// =============================================================================
// Response Helpers
// =============================================================================

/**
 * Create a JSON error response with CORS headers
 */
export function errorResponse(
  request: Request,
  message: string,
  status: number = 400
): Response {
  return Response.json(
    { success: false, message },
    { status, headers: getCorsHeaders(request) }
  );
}

/**
 * Create a JSON success response with CORS headers
 */
export function successResponse(
  request: Request,
  data: Record<string, unknown>
): Response {
  return Response.json(
    { success: true, ...data },
    { headers: getCorsHeaders(request) }
  );
}

// =============================================================================
// Common Validation
// =============================================================================

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
}

/**
 * Validate contact form payload
 */
export function validateContactPayload(data: unknown): data is ContactPayload {
  if (!data || typeof data !== 'object') return false;

  const payload = data as Record<string, unknown>;

  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    return false;
  }
  if (typeof payload.email !== 'string' || !isValidEmail(payload.email)) {
    return false;
  }
  if (typeof payload.message !== 'string' || payload.message.trim().length === 0) {
    return false;
  }
  if (typeof payload.turnstileToken !== 'string' || payload.turnstileToken.trim().length === 0) {
    return false;
  }

  if (payload.name.length > 100) return false;
  if (payload.email.length > 254) return false;
  if (payload.message.length > 5000) return false;

  return true;
}
/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
