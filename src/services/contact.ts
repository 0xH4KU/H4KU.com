import { CONTACT_CONFIG, isContactEndpointConfigured } from '@/config/contact';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactApiResponse {
  success: boolean;
  message?: string;
  referenceId?: string;
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'lum.bio-contact-form',
};

export class ContactSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactSubmissionError';
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

function mergeAbortSignals(
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
