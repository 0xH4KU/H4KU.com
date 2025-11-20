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

  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(
      () => {
        runInit();
      },
      { timeout: 2500 }
    );
  } else {
    window.setTimeout(runInit, 1200);
  }
};

export const initializeMonitoring = async (): Promise<boolean> => {
  if (isInitialized) {
    return monitoringEnabled;
  }

  isInitialized = true;

  if (typeof window === 'undefined' || !SENTRY_DSN) {
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
