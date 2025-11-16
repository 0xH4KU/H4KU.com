import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  secureClear,
  secureLog,
  secureWarn,
  secureInfo,
} from '@/utils/secureConsole';

const originalConsole = globalThis.console;

afterEach(() => {
  globalThis.console = originalConsole;
  vi.restoreAllMocks();
});

describe('secureConsole', () => {
  it('logs through the existing console implementation', () => {
    const logSpy = vi
      .spyOn(globalThis.console, 'log')
      .mockImplementation(() => {});

    secureLog('hello', 42);

    expect(logSpy).toHaveBeenCalledWith('hello', 42);
  });

  it('warns when a console exists', () => {
    const warnSpy = vi
      .spyOn(globalThis.console, 'warn')
      .mockImplementation(() => {});

    secureWarn('be careful');

    expect(warnSpy).toHaveBeenCalledWith('be careful');
  });

  it('fails silently when the requested console method is missing', () => {
    // @ts-expect-error override warn to simulate missing method
    globalThis.console.warn = undefined;

    expect(() => secureWarn('no-op')).not.toThrow();
  });

  it('clears the console when supported', () => {
    const clearSpy = vi
      .spyOn(globalThis.console, 'clear')
      .mockImplementation(() => {});

    secureClear();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('routes through other console methods', () => {
    const infoSpy = vi
      .spyOn(globalThis.console, 'info')
      .mockImplementation(() => {});

    secureInfo('hello', { id: 1 });

    expect(infoSpy).toHaveBeenCalledWith('hello', { id: 1 });
  });

  it('fails silently when console is unavailable', () => {
    // @ts-expect-error intentionally remove console for the test
    globalThis.console = undefined;

    expect(() => secureLog('noop')).not.toThrow();
    expect(() => secureWarn('noop')).not.toThrow();
    expect(() => secureClear()).not.toThrow();
  });
});
