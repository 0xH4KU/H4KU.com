import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockNavigator = (overrides: Partial<Navigator> = {}) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Chrome',
      connection: { saveData: false },
      deviceMemory: 8,
      ...overrides,
    },
    configurable: true,
  });
};

const restoreNavigator = (original: Navigator | undefined) => {
  if (original) {
    Object.defineProperty(globalThis, 'navigator', {
      value: original,
      configurable: true,
    });
  }
};

const setupMonitoringModule = async (
  env: Record<string, string> = {},
  sentryFactory?: () => Record<string, unknown>
) => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.doUnmock('@sentry/browser');

  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));

  const sentryMock = {
    init: vi.fn(),
    captureException: vi.fn((error, scopeFn?: (scope: { setContext: ReturnType<typeof vi.fn>; setTag: ReturnType<typeof vi.fn>; setExtra: ReturnType<typeof vi.fn> }) => void) => {
      if (scopeFn) {
        const scope = {
          setContext: vi.fn(),
          setTag: vi.fn(),
          setExtra: vi.fn(),
        };
        scopeFn(scope);
      }
      return error;
    }),
    captureEvent: vi.fn(),
  };

  vi.doMock('@sentry/browser', sentryFactory ?? (() => sentryMock));

  const module = await import('../monitoring');
  return { module, sentryMock };
};

describe('monitoring service', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    mockNavigator();
    vi.useFakeTimers();
  });

  afterEach(() => {
    restoreNavigator(originalNavigator);
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.doUnmock('@sentry/browser');
  });

  it('disables monitoring when DSN is missing', async () => {
    const { module } = await setupMonitoringModule();
    const initialized = await module.initializeMonitoring();
    expect(initialized).toBe(false);
    expect(() => module.reportError(new Error('noop'))).not.toThrow();
  });

  it('initializes Sentry on first interaction and reports errors', async () => {
    const { module, sentryMock } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
      VITE_APP_VERSION: '1.2.3',
      VITE_APP_ENV: 'test',
    });

    const initialized = await module.initializeMonitoring();
    expect(initialized).toBe(true);

    window.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(sentryMock.init).toHaveBeenCalledTimes(1));

    module.reportError(new Error('boom'), undefined, {
      tags: { feature: 'test' },
    });
    await vi.waitFor(() =>
      expect(sentryMock.captureException).toHaveBeenCalledTimes(1)
    );
  });

  it('skips monitoring for automated agents', async () => {
    mockNavigator({ userAgent: 'Lighthouse 10.0' } as Navigator);
    const { module } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
    });
    const initialized = await module.initializeMonitoring();
    expect(initialized).toBe(false);
  });

  it('skips monitoring on low-priority devices (save-data or low memory)', async () => {
    mockNavigator({
      userAgent: 'Chrome',
      connection: { saveData: true },
      deviceMemory: 1,
    } as unknown as Navigator);
    const { module } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
    });
    const initialized = await module.initializeMonitoring();
    expect(initialized).toBe(false);
  });

  it('recovers gracefully when Sentry fails to load', async () => {
    const { module } = await setupMonitoringModule(
      { VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123' },
      () => ({
        init: () => {
          throw new Error('load failure');
        },
        captureException: vi.fn(),
        captureEvent: vi.fn(),
      })
    );

    await module.initializeMonitoring();
    window.dispatchEvent(new Event('pointerdown'));

    expect(() => module.reportError(new Error('fatal'))).not.toThrow();
  });

  it('reports web vitals when client is ready', async () => {
    const { module, sentryMock } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
    });

    await module.initializeMonitoring();
    window.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(sentryMock.init).toHaveBeenCalledTimes(1));

    module.reportWebVital({
      name: 'LCP',
      value: 1200,
      rating: 'good',
      navigationType: 'navigate',
    });

    await vi.waitFor(() =>
      expect(sentryMock.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'web-vital:LCP',
          tags: expect.objectContaining({
            vital: 'LCP',
            vital_rating: 'good',
            nav_type: 'navigate',
          }),
        })
      )
    );
  });

  it('maps web vital thresholds for FID and poor ratings', async () => {
    const { module, sentryMock } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
    });

    await module.initializeMonitoring();
    window.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(sentryMock.init).toHaveBeenCalledTimes(1));

    module.reportWebVital({
      name: 'FID',
      value: 400,
      rating: 'poor',
    });

    await vi.waitFor(() =>
      expect(sentryMock.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            vital_threshold_bucket: 'poor',
          }),
        })
      )
    );
  });

  it('emits needs-improvement bucket for mid-range vitals', async () => {
    const { module, sentryMock } = await setupMonitoringModule({
      VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123',
    });

    await module.initializeMonitoring();
    window.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(sentryMock.init).toHaveBeenCalledTimes(1));

    module.reportWebVital({
      name: 'LCP',
      value: 3.2,
      rating: 'needs-improvement',
    });

    await vi.waitFor(() =>
      expect(sentryMock.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            vital_threshold_bucket: 'needs-improvement',
          }),
        })
      )
    );
  });

  it('falls back to console warning when client is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { module } = await setupMonitoringModule(
      { VITE_SENTRY_DSN: 'https://example-dsn.ingest.sentry.io/123' },
      () => ({
        init: () => {
          throw new Error('load failure');
        },
        captureException: vi.fn(),
        captureEvent: vi.fn(),
      })
    );

    await module.initializeMonitoring();
    window.dispatchEvent(new Event('pointerdown'));
    module.reportWebVital({
      name: 'CLS',
      value: 0.2,
      rating: 'good',
    });

    await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled());
    warnSpy.mockRestore();
  });
});
