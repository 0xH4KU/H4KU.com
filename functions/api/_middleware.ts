/**
 * Shared middleware for contact API endpoints
 *
 * Provides:
 * - Rate limiting (IP-based, in-memory with Cloudflare KV fallback)
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

/** Rate limit: max requests per window */
export const RATE_LIMIT_MAX = 5;

/** Rate limit window in seconds */
export const RATE_LIMIT_WINDOW = 60;

/** External API timeout in milliseconds */
export const API_TIMEOUT_MS = 10000;

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

export interface RateLimitStore {
  get(key: string): Promise<{ count: number; expires: number } | null>;
  put(key: string, value: { count: number; expires: number }, ttl: number): Promise<void>;
}

export interface MiddlewareEnv {
  RATE_LIMIT_KV?: KVNamespace;
}

// =============================================================================
// In-memory rate limit store (fallback)
// =============================================================================

const memoryStore = new Map<string, { count: number; expires: number }>();

const inMemoryRateLimitStore: RateLimitStore = {
  async get(key: string) {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      memoryStore.delete(key);
      return null;
    }
    return entry;
  },
  async put(key: string, value: { count: number; expires: number }, _ttl: number) {
    memoryStore.set(key, value);
    // Cleanup old entries periodically
    if (memoryStore.size > 1000) {
      const now = Date.now();
      for (const [k, v] of memoryStore) {
        if (now > v.expires) memoryStore.delete(k);
      }
    }
  },
};

// =============================================================================
// KV-based rate limit store
// =============================================================================

function createKVRateLimitStore(kv: KVNamespace): RateLimitStore {
  return {
    async get(key: string) {
      const value = await kv.get(key, 'json');
      return value as { count: number; expires: number } | null;
    },
    async put(key: string, value: { count: number; expires: number }, ttl: number) {
      await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
    },
  };
}

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * Check and update rate limit for an IP address
 * @returns true if rate limited (should block), false if allowed
 */
export async function checkRateLimit(
  clientIp: string,
  env?: MiddlewareEnv
): Promise<{ limited: boolean; remaining: number; resetIn: number }> {
  const store = env?.RATE_LIMIT_KV
    ? createKVRateLimitStore(env.RATE_LIMIT_KV)
    : inMemoryRateLimitStore;

  const key = `rate:contact:${clientIp}`;
  const now = Date.now();
  const windowEnd = now + RATE_LIMIT_WINDOW * 1000;

  const entry = await store.get(key);

  if (!entry) {
    // First request in window
    await store.put(key, { count: 1, expires: windowEnd }, RATE_LIMIT_WINDOW);
    return { limited: false, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((entry.expires - now) / 1000);
    return { limited: true, remaining: 0, resetIn: Math.max(0, resetIn) };
  }

  // Increment counter
  await store.put(key, { count: entry.count + 1, expires: entry.expires }, RATE_LIMIT_WINDOW);
  const resetIn = Math.ceil((entry.expires - now) / 1000);
  return {
    limited: false,
    remaining: RATE_LIMIT_MAX - entry.count - 1,
    resetIn: Math.max(0, resetIn),
  };
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

/**
 * Create rate limit exceeded response
 */
export function rateLimitResponse(request: Request, resetIn: number): Response {
  return Response.json(
    {
      success: false,
      message: `Too many requests. Please try again in ${resetIn} seconds.`,
    },
    {
      status: 429,
      headers: {
        ...getCorsHeaders(request),
        'Retry-After': String(resetIn),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + resetIn),
      },
    }
  );
}

// =============================================================================
// Common Validation
// =============================================================================

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

/**
 * Simple but effective email validation
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
