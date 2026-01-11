import { CONTACT_CONFIG, isContactEndpointConfigured } from '@/config/contact';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
}

export interface ContactApiResponse {
  success: boolean;
  message?: string;
  referenceId?: string;
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'H4KU.com-contact-form',
};

const PENDING_CONTACT_KEY = 'contact:pending-submission';
const PENDING_CONTACT_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type PendingContactPayload = Omit<ContactPayload, 'turnstileToken'>;

export class ContactSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactSubmissionError';
  }
}

const canUseSessionStorage = () =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

export function savePendingContact(payload: PendingContactPayload) {
  if (!canUseSessionStorage()) return;

  try {
    const envelope = {
      ...payload,
      createdAt: Date.now(),
    };
    window.sessionStorage.setItem(
      PENDING_CONTACT_KEY,
      JSON.stringify(envelope)
    );
  } catch (error) {
    // Swallow storage errors (Safari private mode, quota, etc.)
    if (import.meta.env.DEV) {
      console.warn('[contact] failed to save pending payload', error);
    }
  }
}

export function loadPendingContact(): PendingContactPayload | null {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_CONTACT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingContactPayload & {
      createdAt?: number;
    };
    const createdAt =
      typeof parsed.createdAt === 'number' ? parsed.createdAt : 0;
    const isExpired = createdAt
      ? Date.now() - createdAt > PENDING_CONTACT_TTL_MS
      : true;

    if (isExpired) {
      window.sessionStorage.removeItem(PENDING_CONTACT_KEY);
      return null;
    }

    const { name, email, message } = parsed;
    if (!name || !email || !message) {
      return null;
    }

    return { name, email, message };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[contact] failed to load pending payload', error);
    }
    return null;
  }
}

export function clearPendingContact() {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(PENDING_CONTACT_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[contact] failed to clear pending payload', error);
    }
  }
}

export async function submitContactRequest(
  payload: ContactPayload,
  signal?: AbortSignal
): Promise<ContactApiResponse> {
  if (!isContactEndpointConfigured()) {
    throw new ContactSubmissionError(
      'Contact endpoint is not configured. Please set VITE_CONTACT_ENDPOINT.'
    );
  }

  const shouldEnforceTimeout = CONTACT_CONFIG.TIMEOUT_MS > 0;
  const timeoutController = shouldEnforceTimeout
    ? new AbortController()
    : undefined;

  const mergedSignal = mergeAbortSignals(signal, timeoutController?.signal);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeoutController) {
    timeoutId = setTimeout(
      () => timeoutController.abort(),
      CONTACT_CONFIG.TIMEOUT_MS
    );
  }

  let response: Response;
  try {
    response = await fetch(CONTACT_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload),
      signal: mergedSignal ?? undefined,
      credentials: 'omit',
      mode: 'cors',
    });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }

  let data: ContactApiResponse | null = null;
  try {
    data = (await response.json()) as ContactApiResponse;
  } catch {
    // Non-JSON responses are handled via the status code below.
  }

  if (!response.ok || data?.success === false) {
    const errorMessage =
      data?.message ||
      `Contact endpoint responded with ${response.status} ${response.statusText}`;
    throw new ContactSubmissionError(errorMessage);
  }

  return data ?? { success: true };
}

export function mergeAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortSignal | undefined {
  const activeSignals = signals.filter((signal): signal is AbortSignal =>
    Boolean(signal)
  );
  if (activeSignals.length <= 1) {
    return activeSignals[0];
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  activeSignals.forEach(signal => {
    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener('abort', abort, { once: true });
    }
  });
  return controller.signal;
}
