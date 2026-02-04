import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  API_TIMEOUT_MS,
  MAX_BODY_SIZE,
  checkBodySize,
  corsPreflightResponse,
  createTimeoutController,
  errorResponse,
  escapeHtml,
  fetchWithTimeout,
  generateSecureReferenceId,
  getCorsHeaders,
  isOriginAllowed,
  maskEmail,
  successResponse,
  validateContactPayload,
  verifyTurnstile,
} from '../../functions/api/_middleware';
import { APP_ORIGIN } from '@/config/domains';

describe('functions/api/_middleware', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('isOriginAllowed', () => {
    it('allows known origins and preview deployments (case-insensitive)', () => {
      expect(isOriginAllowed('https://h4ku.com')).toBe(true);
      expect(isOriginAllowed('https://H4KU.COM')).toBe(true);
      expect(isOriginAllowed('https://www.h4ku.com')).toBe(true);
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(isOriginAllowed('https://pr-123.h4ku-com.pages.dev')).toBe(true);
      expect(isOriginAllowed('https://PR-123.h4ku-com.pages.dev')).toBe(true);
    });

    it('rejects null and unknown origins', () => {
      expect(isOriginAllowed(null)).toBe(false);
      expect(isOriginAllowed('https://evil.example')).toBe(false);
    });
  });

  describe('getCorsHeaders', () => {
    it('echoes the allowed origin and varies by Origin', () => {
      const request = new Request('https://example.test', {
        headers: { Origin: 'https://h4ku.com' },
      });

      const headers = getCorsHeaders(request);
      expect(headers['Access-Control-Allow-Origin']).toBe('https://h4ku.com');
      expect(headers['Access-Control-Allow-Methods']).toMatch(/OPTIONS/);
      expect(headers['Vary']).toBe('Origin');
    });

    it('falls back to default origin when disallowed', () => {
      const request = new Request('https://example.test', {
        headers: { Origin: 'https://evil.example' },
      });

      const headers = getCorsHeaders(request);
      expect(headers['Access-Control-Allow-Origin']).toBe(APP_ORIGIN);
      expect(headers['Vary']).toBe('Origin');
    });
  });

  describe('corsPreflightResponse', () => {
    it('returns a 204 response with CORS headers', () => {
      const request = new Request('https://example.test', {
        method: 'OPTIONS',
        headers: { Origin: 'https://h4ku.com' },
      });

      const response = corsPreflightResponse(request);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://h4ku.com'
      );
      expect(response.headers.get('Vary')).toBe('Origin');
    });
  });

  describe('checkBodySize', () => {
    it('rejects when Content-Length exceeds MAX_BODY_SIZE', () => {
      const request = new Request('https://example.test', {
        headers: { 'Content-Length': String(MAX_BODY_SIZE + 1) },
      });

      expect(checkBodySize(request)).toMatch(/Request body too large/);
    });

    it('returns null when Content-Length is missing or within limit', () => {
      expect(checkBodySize(new Request('https://example.test'))).toBeNull();
      const ok = new Request('https://example.test', {
        headers: { 'Content-Length': String(MAX_BODY_SIZE) },
      });
      expect(checkBodySize(ok)).toBeNull();
    });
  });

  describe('createTimeoutController', () => {
    it('aborts after the configured timeout and can be cleared', () => {
      vi.useFakeTimers();
      const { controller, clear } = createTimeoutController(25);
      expect(controller.signal.aborted).toBe(false);

      vi.advanceTimersByTime(30);
      expect(controller.signal.aborted).toBe(true);

      const { controller: next, clear: clearNext } = createTimeoutController(25);
      clearNext();
      vi.advanceTimersByTime(30);
      expect(next.signal.aborted).toBe(false);

      clear();
      vi.useRealTimers();
    });
  });

  describe('fetchWithTimeout', () => {
    it('passes an AbortSignal to fetch and clears the timer', async () => {
      const spy = vi.fn().mockResolvedValue(new Response('ok'));
      vi.stubGlobal('fetch', spy);

      await expect(
        fetchWithTimeout('https://example.test', { method: 'GET' }, API_TIMEOUT_MS)
      ).resolves.toBeInstanceOf(Response);

      expect(spy).toHaveBeenCalledWith(
        'https://example.test',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  describe('verifyTurnstile', () => {
    it('rejects missing token', async () => {
      await expect(verifyTurnstile('', '1.2.3.4', 'secret')).resolves.toEqual({
        success: false,
        error: 'Missing verification token',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects missing secret key', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(verifyTurnstile('token', '1.2.3.4', '')).resolves.toEqual({
        success: false,
        error: 'Server configuration error',
      });
      expect(errorSpy).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns success when Turnstile succeeds', async () => {
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as unknown as Response);

      await expect(
        verifyTurnstile('token', '1.2.3.4', 'secret')
      ).resolves.toEqual({ success: true });
    });

    it('returns a user-facing error when Turnstile fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      } as unknown as Response);

      await expect(
        verifyTurnstile('token', '1.2.3.4', 'secret')
      ).resolves.toEqual({
        success: false,
        error: 'Human verification failed. Please try again.',
      });

      expect(warnSpy).toHaveBeenCalled();
    });

    it('handles network/timeout failures', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockRejectedValueOnce(new Error('timeout'));

      await expect(
        verifyTurnstile('token', '1.2.3.4', 'secret')
      ).resolves.toEqual({
        success: false,
        error: 'Verification service unavailable',
      });

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('maskEmail', () => {
    it('masks local and domain parts', () => {
      expect(maskEmail('user@example.com')).toBe('us***@ex***.com');
      expect(maskEmail('ab@example.com')).toBe('***@ex***.com');
      expect(maskEmail('user@domain')).toBe('us***@do***');
      expect(maskEmail('invalid')).toBe('***');
    });
  });

  describe('generateSecureReferenceId', () => {
    it('generates an uppercase reference id', () => {
      const ref = generateSecureReferenceId();
      expect(ref).toMatch(/^HAKU-[A-Z0-9]+-[A-F0-9]{8}$/);
      expect(ref).toBe(ref.toUpperCase());
    });
  });

  describe('response helpers', () => {
    it('creates JSON error and success responses with CORS headers', async () => {
      const request = new Request('https://example.test', {
        headers: { Origin: 'https://h4ku.com' },
      });

      const error = errorResponse(request, 'Bad', 400);
      expect(error.status).toBe(400);
      await expect(error.json()).resolves.toMatchObject({
        success: false,
        message: 'Bad',
      });
      expect(error.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://h4ku.com'
      );

      const success = successResponse(request, { referenceId: 'ref' });
      expect(success.status).toBe(200);
      await expect(success.json()).resolves.toMatchObject({
        success: true,
        referenceId: 'ref',
      });
      expect(success.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://h4ku.com'
      );
    });
  });

  describe('validateContactPayload', () => {
    const base = {
      name: 'Tester',
      email: 'user@example.com',
      message: 'Hello',
      turnstileToken: 'token',
    };

    it('accepts a valid payload', () => {
      expect(validateContactPayload(base)).toBe(true);
    });

    it('rejects missing/invalid fields and boundary violations', () => {
      expect(validateContactPayload(null)).toBe(false);
      expect(validateContactPayload({ ...base, email: 'not-an-email' })).toBe(
        false
      );
      expect(validateContactPayload({ ...base, name: '   ' })).toBe(false);
      expect(validateContactPayload({ ...base, message: '' })).toBe(false);
      expect(validateContactPayload({ ...base, turnstileToken: '' })).toBe(
        false
      );

      expect(
        validateContactPayload({ ...base, name: 'a'.repeat(101) })
      ).toBe(false);
      expect(
        validateContactPayload({ ...base, email: `${'a'.repeat(255)}@x.com` })
      ).toBe(false);
      expect(
        validateContactPayload({ ...base, message: 'a'.repeat(5001) })
      ).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#039;');
    });
  });
});
