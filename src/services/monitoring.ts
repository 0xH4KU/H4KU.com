import type { ErrorInfo } from 'react';
type SentryClient = typeof import('@sentry/browser');

interface MonitoringContext {
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

/**
 * Monitoring initialization state machine
 *
 * States:
 * - idle: Not initialized, not started
 * - scheduled: Idle/interaction init scheduled
 * - loading: Sentry module is being loaded
 * - ready: Sentry initialized and ready
 * - disabled: Monitoring disabled (no DSN, low device, etc.)
 * - error: Failed to initialize
 */
type MonitoringState =
  | { status: 'idle' }
  | { status: 'scheduled' }
  | { status: 'loading'; promise: Promise<SentryClient | null> }
  | { status: 'ready'; client: SentryClient }
  | { status: 'disabled' }
  | { status: 'error' };

let state: MonitoringState = { status: 'idle' };

const getEnv = (key: string) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
};

const SENTRY_DSN = getEnv('VITE_SENTRY_DSN');
const APP_VERSION = getEnv('VITE_APP_VERSION') ?? 'development';
const APP_ENV =
  getEnv('VITE_APP_ENV') ?? (import.meta.env.DEV ? 'dev' : 'prod');

const isAutomatedAgent = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  return (
    /\bLighthouse\b/i.test(ua) ||
    /\bChrome-Lighthouse\b/i.test(ua) ||
    /\bPageSpeed\b/i.test(ua)
  );
};

const isLowPriorityDevice = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      ?.connection?.saveData ?? false;

  const deviceMemory =
    (navigator as Navigator & { deviceMemory?: number })?.deviceMemory ?? 4;

  return saveData || deviceMemory <= 2;
};

const shouldLoadMonitoring = () =>
  Boolean(SENTRY_DSN) && !isAutomatedAgent() && !isLowPriorityDevice();

/**
 * Get the Sentry client, initializing if needed
 */
const getClient = async (): Promise<SentryClient | null> => {
  // Already ready
  if (state.status === 'ready') {
    return state.client;
  }

  // Already loading - wait for it
  if (state.status === 'loading') {
    return state.promise;
  }

  // Disabled or errored - return null
  if (state.status === 'disabled' || state.status === 'error') {
    return null;
  }

  // Check if we should load
  if (!shouldLoadMonitoring()) {
    state = { status: 'disabled' };
    return null;
  }

  // Start loading
  const loadPromise = import('@sentry/browser')
    .then(Sentry => {
      Sentry.init({
        dsn: SENTRY_DSN,
        release: APP_VERSION,
        environment: APP_ENV,
        tracesSampleRate: 0.05,
        replaysSessionSampleRate: 0.0,
        integrations: [],
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
          }
          return event;
        },
      });
      state = { status: 'ready', client: Sentry };
      return Sentry;
    })
    .catch(error => {
      if (import.meta.env.DEV) {
        console.warn('[monitoring] Failed to load Sentry:', error);
      }
      state = { status: 'error' };
      return null;
    });

  state = { status: 'loading', promise: loadPromise };
  return loadPromise;
};

/**
 * Schedule deferred initialization on idle or first interaction
 */
const scheduleInit = () => {
  if (
    state.status !== 'idle' ||
    typeof window === 'undefined' ||
    !shouldLoadMonitoring()
  ) {
    return;
  }

  state = { status: 'scheduled' };

  const runInit = () => {
    if (state.status === 'scheduled') {
      void getClient();
    }
  };

  // Init on first interaction
  const onFirstInteraction = () => {
    window.removeEventListener('pointerdown', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
    runInit();
  };

  window.addEventListener('pointerdown', onFirstInteraction, {
    passive: true,
    once: true,
  });
  window.addEventListener('keydown', onFirstInteraction, { once: true });

  // Init during idle time
  const idleWindow = window as typeof window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(runInit, { timeout: 4000 });
  } else {
    window.setTimeout(runInit, 4000);
  }
};

export const initializeMonitoring = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !shouldLoadMonitoring()) {
    state = { status: 'disabled' };
    return false;
  }

  scheduleInit();
  return true;
};

export const reportError = (
  error: unknown,
  info?: ErrorInfo,
  context?: MonitoringContext
): void => {
  if (state.status === 'disabled' || typeof window === 'undefined') {
    return;
  }

  const normalizedError =
    error instanceof Error ? error : new Error(String(error));

  const sendToSentry = async () => {
    const client = await getClient();
    if (!client) {
      return;
    }

    client.captureException(normalizedError, scope => {
      if (info?.componentStack || context?.componentStack) {
        scope.setContext('react', {
          componentStack: context?.componentStack ?? info?.componentStack ?? '',
        });
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      return scope;
    });
  };

  void sendToSentry();
};

export type WebVitalEntry = {
  name: 'LCP' | 'FID' | 'CLS';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
};

export const reportWebVital = (entry: WebVitalEntry): void => {
  if (typeof window === 'undefined' || !shouldLoadMonitoring()) return;

  // Rough thresholds based on Core Web Vitals guidance.
  // These are only used to tag events; sampling is still handled by Sentry.
  const thresholds = {
    LCP: { good: 2.5, poor: 4.0 },
    FID: { good: 0.1, poor: 0.3 }, // seconds
    CLS: { good: 0.1, poor: 0.25 },
  } as const;

  const getSeverityLevel = () => {
    if (entry.rating === 'poor') {
      return 'warning' as const;
    }
    return 'info' as const;
  };

  const getThresholdBucket = () => {
    const metricThreshold = thresholds[entry.name];
    if (!metricThreshold) return 'unknown';

    const normalizedValue =
      entry.name === 'FID' ? entry.value / 1000 : entry.value;

    if (normalizedValue <= metricThreshold.good) return 'good';
    if (normalizedValue >= metricThreshold.poor) return 'poor';
    return 'needs-improvement';
  };

  const level = getSeverityLevel();
  const thresholdBucket = getThresholdBucket();

  const send = async () => {
    const client = await getClient();

    if (client) {
      client.captureEvent({
        message: `web-vital:${entry.name}`,
        level,
        tags: {
          vital: entry.name,
          vital_rating: entry.rating,
          nav_type: entry.navigationType ?? 'unknown',
          vital_threshold_bucket: thresholdBucket,
        },
        extra: {
          value: entry.value,
        },
      });
    } else if (import.meta.env.DEV) {
      console.warn('[monitoring:web-vitals]', entry);
    }
  };

  void send();
};
