import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const isConfiguredMock = vi.fn(() => true);

vi.mock('@/config/contact', () => ({
  CONTACT_CONFIG: {
    ENDPOINT: 'https://api.test/contact',
    TIMEOUT_MS: 50,
  },
  isContactEndpointConfigured: isConfiguredMock,
}));

const {
  savePendingContact,
  loadPendingContact,
  clearPendingContact,
  submitContactRequest,
  mergeAbortSignals,
  ContactSubmissionError,
} = await import('@/services/contact');

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const PENDING_KEY = 'contact:pending-submission';
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const basePayload = {
  name: 'Tester',
  email: 'user@example.com',
  message: 'Hello',
  turnstileToken: 'token',
};

describe('pending contact storage', () => {
  const originalSessionStorage = window.sessionStorage;

  beforeEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      configurable: true,
      writable: true,
    });
  });

  it('returns null when sessionStorage is unavailable', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(loadPendingContact()).toBeNull();
    expect(() =>
      savePendingContact({ name: 'x', email: 'x@y.com', message: 'hi' })
    ).not.toThrow();
    expect(loadPendingContact()).toBeNull();
  });

  it('saves, loads, and clears a pending payload', () => {
    const payload = {
      name: 'Tester',
      email: 'user@example.com',
      message: 'Hello',
    };
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    savePendingContact(payload);
    expect(loadPendingContact()).toEqual(payload);

    clearPendingContact();
    expect(loadPendingContact()).toBeNull();
  });

  it('expires stale pending payloads and removes the stored item', () => {
    const payload = {
      name: 'Tester',
      email: 'user@example.com',
      message: 'Hello',
    };
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    savePendingContact(payload);

    vi.setSystemTime(Date.now() + FIFTEEN_MINUTES + 1000);
    expect(loadPendingContact()).toBeNull();
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('ignores malformed or incomplete stored payloads', () => {
    window.sessionStorage.setItem(PENDING_KEY, '{ not json ');
    expect(loadPendingContact()).toBeNull();

    window.sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ name: 'x', email: '', message: '' })
    );
    expect(loadPendingContact()).toBeNull();
  });
});

describe('submitContactRequest', () => {
  beforeEach(() => {
    isConfiguredMock.mockReturnValue(true);
    fetchMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when endpoint is not configured', async () => {
    isConfiguredMock.mockReturnValueOnce(false);

    await expect(submitContactRequest(basePayload)).rejects.toThrow(
      ContactSubmissionError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits successfully and returns the API response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true, referenceId: 'ref-123' }),
    });

    const result = await submitContactRequest(basePayload);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/contact',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(basePayload),
      })
    );
    expect(result).toEqual({ success: true, referenceId: 'ref-123' });

    await vi.runOnlyPendingTimersAsync();
  });

  it('surface server errors as ContactSubmissionError', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ message: 'Boom' }),
    });

    await expect(submitContactRequest(basePayload)).rejects.toThrow(
      /Boom|500/ // prefer explicit server message when present
    );
  });

  it('throws when backend responds success=false even with 200', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: false, message: 'Rejected' }),
    });

    await expect(submitContactRequest(basePayload)).rejects.toThrow(
      /Rejected|200/
    );
  });

  it('falls back to default success when response body cannot be parsed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => {
        throw new Error('no body');
      },
    });

    const result = await submitContactRequest(basePayload);
    expect(result).toEqual({ success: true });
  });
});

describe('clearPendingContact', () => {
  it('swallows errors from sessionStorage.removeItem', () => {
    const originalRemove = window.sessionStorage.removeItem;
    window.sessionStorage.removeItem = () => {
      throw new Error('storage blocked');
    };

    expect(() => clearPendingContact()).not.toThrow();

    window.sessionStorage.removeItem = originalRemove;
  });
});

describe('mergeAbortSignals', () => {
  it('returns undefined for no signals and passes through a single signal', () => {
    expect(mergeAbortSignals()).toBeUndefined();

    const controller = new AbortController();
    expect(mergeAbortSignals(controller.signal)).toBe(controller.signal);
  });

  it('aborts immediately when any provided signal is already aborted', () => {
    const aborted = new AbortController();
    aborted.abort();
    const active = new AbortController();

    const merged = mergeAbortSignals(aborted.signal, active.signal);
    expect(merged?.aborted).toBe(true);
  });

  it('listens to abort events across signals', () => {
    const a = new AbortController();
    const b = new AbortController();

    const merged = mergeAbortSignals(a.signal, b.signal);
    expect(merged?.aborted).toBe(false);

    a.abort();
    expect(merged?.aborted).toBe(true);
  });
});

describe('submitContactRequest timeout handling', () => {
  afterAll(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('skips timeout wiring when TIMEOUT_MS is zero or negative', async () => {
    vi.resetModules();
    vi.doMock('@/config/contact', () => ({
      CONTACT_CONFIG: {
        ENDPOINT: 'https://api.test/contact',
        TIMEOUT_MS: 0,
      },
      isContactEndpointConfigured: () => true,
    }));

    const localFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', localFetch);

    const { submitContactRequest: submitNoTimeout } =
      await import('@/services/contact');

    await expect(submitNoTimeout(basePayload)).resolves.toEqual({
      success: true,
    });
    expect(localFetch).toHaveBeenCalled();
  });
});
