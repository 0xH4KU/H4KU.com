import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureError = vi.hoisted(() => vi.fn());
const secureWarn = vi.hoisted(() => vi.fn());
const reportMonitoringError = vi.hoisted(() => vi.fn());

vi.mock('@/utils/secureConsole', () => ({
  secureError,
  secureWarn,
}));

vi.mock('@/services/monitoring', () => ({
  reportError: reportMonitoringError,
}));

import { reportError } from '../reportError';

describe('reportError', () => {
  beforeEach(() => {
    secureError.mockClear();
    secureWarn.mockClear();
    reportMonitoringError.mockClear();
  });

  it('skips logging when silent but still reports to monitoring', () => {
    reportError('boom', { logMode: 'silent', tags: { env: 'test' } });

    expect(secureError).not.toHaveBeenCalled();
    expect(secureWarn).not.toHaveBeenCalled();
    expect(reportMonitoringError).toHaveBeenCalledTimes(1);

    const [, , context] = reportMonitoringError.mock.calls[0];
    expect(context?.tags).toEqual({ env: 'test' });
  });

  it('logs warnings with extras and includes scope tags', () => {
    reportError(new Error('warn'), {
      logMode: 'always',
      level: 'warn',
      scope: 'storage',
      tags: { env: 'test' },
      extra: { key: 'value' },
      componentStack: 'stack',
    });

    expect(secureWarn).toHaveBeenCalledWith('[storage]', expect.any(Error), {
      key: 'value',
    });

    const [, , context] = reportMonitoringError.mock.calls[0];
    expect(context).toEqual({
      componentStack: 'stack',
      tags: { scope: 'storage', env: 'test' },
      extra: { key: 'value' },
    });
  });

  it('logs errors without extras by default', () => {
    reportError('boom', { logMode: 'always' });

    expect(secureError).toHaveBeenCalledWith('[error]', expect.any(Error));
    expect(reportMonitoringError).toHaveBeenCalledTimes(1);
  });

  it('defaults to dev logging when logMode is omitted', () => {
    reportError(new Error('dev'));

    expect(secureError).toHaveBeenCalledWith('[error]', expect.any(Error));
  });

  it('builds monitoring context without tags when only componentStack exists', () => {
    reportError('stacked', { logMode: 'always', componentStack: 'stack' });

    const [, , context] = reportMonitoringError.mock.calls[0];
    expect(context).toEqual({ componentStack: 'stack' });
  });
});
