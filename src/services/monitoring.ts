import type { ErrorInfo } from 'react';
type SentryClient = typeof import('@sentry/browser');

interface MonitoringContext {
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

let isInitialized = false;
let monitoringEnabled = false;
let sentryClient: SentryClient | null = null;
let sentryClientPromise: Promise<SentryClient> | null = null;
let monitoringInitPromise: Promise<SentryClient | null> | null = null;
let idleInitScheduled = false;
let interactionInitHooked = false;

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

const loadSentryClient = async (): Promise<SentryClient> => {
  if (sentryClient) {
    return sentryClient;
  }
  if (!sentryClientPromise) {
    sentryClientPromise = import('@sentry/browser').then(module => {
      sentryClient = module;
      return module;
    });
  }
  return sentryClientPromise;
};

const beginMonitoringInit = async (): Promise<SentryClient | null> => {
  if (monitoringInitPromise) {
    return monitoringInitPromise;
  }
  if (!shouldLoadMonitoring()) {
    monitoringEnabled = false;
    return null;
  }

  monitoringInitPromise = loadSentryClient()
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
      monitoringEnabled = true;
      return Sentry;
    })
    .catch(error => {
      if (import.meta.env.DEV) {
        console.warn('[monitoring] Failed to load Sentry:', error);
      }
      monitoringEnabled = false;
      monitoringInitPromise = null;
      sentryClientPromise = null;
      sentryClient = null;
      return null;
    });
  return monitoringInitPromise;
};

const scheduleMonitoringInit = () => {
  if (
    idleInitScheduled ||
    monitoringEnabled ||
    monitoringInitPromise ||
    typeof window === 'undefined'
  ) {
    return;
  }
  if (!shouldLoadMonitoring()) {
    return;
  }

  idleInitScheduled = true;

  const runInit = () => {
    idleInitScheduled = false;
    void beginMonitoringInit();
  };

  const idleWindow = window as typeof window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  };

  if (!interactionInitHooked) {
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
    interactionInitHooked = true;
  }

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(
      () => {
        runInit();
      },
      { timeout: 4000 }
    );
  } else {
    window.setTimeout(runInit, 4000);
  }
};

export const initializeMonitoring = async (): Promise<boolean> => {
  if (isInitialized) {
    return monitoringEnabled;
  }

  isInitialized = true;

  if (typeof window === 'undefined' || !shouldLoadMonitoring()) {
    monitoringEnabled = false;
    return false;
  }

  scheduleMonitoringInit();
  return true;
};

export const reportError = (
  error: unknown,
  info?: ErrorInfo,
  context?: MonitoringContext
): void => {
  if (!monitoringEnabled || typeof window === 'undefined') {
    return;
  }

  const normalizedError =
    error instanceof Error ? error : new Error(String(error));

  const sendToSentry = async () => {
    const ongoingInit = monitoringInitPromise;
    const client =
      sentryClient ??
      (ongoingInit ? await ongoingInit : null) ??
      (await beginMonitoringInit());
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

  const send = async () => {
    const client = monitoringEnabled
      ? (sentryClient ??
        (monitoringInitPromise
          ? await monitoringInitPromise
          : await beginMonitoringInit()))
      : null;

    if (client) {
      client.captureEvent({
        message: `web-vital:${entry.name}`,
        level: 'info',
        tags: {
          vital: entry.name,
          vital_rating: entry.rating,
          nav_type: entry.navigationType ?? 'unknown',
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
