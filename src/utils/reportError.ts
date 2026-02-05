import type { ErrorInfo } from 'react';
import { reportError as reportMonitoringError } from '@/services/monitoring';
import { secureError, secureWarn } from '@/utils/secureConsole';

export type ReportErrorLevel = 'warn' | 'error';
export type ReportErrorLogMode = 'dev' | 'always' | 'silent';

export interface ReportErrorContext {
  scope?: string;
  level?: ReportErrorLevel;
  logMode?: ReportErrorLogMode;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  componentStack?: string;
  info?: ErrorInfo;
}

const shouldLog = (logMode: ReportErrorLogMode) => {
  if (logMode === 'always') {
    return true;
  }
  if (logMode === 'silent') {
    return false;
  }
  return import.meta.env.DEV;
};

export const reportError = (
  error: unknown,
  context: ReportErrorContext = {}
): void => {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));
  const logMode = context.logMode ?? 'dev';
  const level = context.level ?? 'error';
  const label = context.scope ? `[${context.scope}]` : '[error]';

  if (shouldLog(logMode)) {
    const logger = level === 'warn' ? secureWarn : secureError;
    if (context.extra) {
      logger(label, normalizedError, context.extra);
    } else {
      logger(label, normalizedError);
    }
  }

  const tags = context.scope
    ? { scope: context.scope, ...(context.tags ?? {}) }
    : context.tags;
  const componentStack = context.componentStack ?? context.info?.componentStack;

  const monitoringContext =
    tags || context.extra || componentStack
      ? {
          ...(componentStack ? { componentStack } : {}),
          ...(tags ? { tags } : {}),
          ...(context.extra ? { extra: context.extra } : {}),
        }
      : undefined;

  reportMonitoringError(normalizedError, context.info, monitoringContext);
};
