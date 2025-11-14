import type { ErrorInfo } from 'react';
import * as Sentry from '@sentry/browser';

interface MonitoringContext {
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

let isInitialized = false;
let monitoringEnabled = false;

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

export const initializeMonitoring = (): boolean => {
  if (isInitialized) {
    return monitoringEnabled;
  }

  isInitialized = true;

  if (typeof window === 'undefined' || !SENTRY_DSN) {
    return false;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    release: APP_VERSION,
    environment: APP_ENV,
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0.0,
    integrations: [],
    beforeSend(event) {
      // Ensure we never leak user input fields.
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });

  monitoringEnabled = true;
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

  Sentry.captureException(normalizedError, scope => {
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
