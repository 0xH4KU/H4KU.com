/* eslint-disable no-console */
import { describe, it, expect, vi } from 'vitest';
import {
  secureLog,
  secureInfo,
  secureWarn,
  secureError,
  secureClear,
} from '@/utils/secureConsole';

describe('secureConsole helpers', () => {
  it('invokes console methods when available', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});

    secureLog('message', 42);
    secureWarn('warn');
    secureError('error');
    secureClear();

    expect(logSpy).toHaveBeenCalledWith('message', 42);
    expect(warnSpy).toHaveBeenCalledWith('warn');
    expect(errorSpy).toHaveBeenCalledWith('error');
    expect(clearSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it('gracefully handles missing console reference', () => {
    const originalConsole = globalThis.console;
    Reflect.deleteProperty(globalThis as { console?: Console }, 'console');

    expect(() => secureInfo('offline')).not.toThrow();

    globalThis.console = originalConsole;
  });

  it('skips invocation when console method is not a function', () => {
    const originalLog = console.log;
    (console as unknown as { log: unknown }).log = null;

    expect(() => secureLog('noop')).not.toThrow();

    console.log = originalLog;
  });
});
