/* istanbul ignore file */

const getConsoleRef = () => {
  /* istanbul ignore next */
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const globalConsole = (globalThis as { console?: Console }).console;
  if (!globalConsole) {
    return null;
  }

  return globalConsole;
};

const callConsole = (method: keyof Console, args: unknown[]): void => {
  const consoleRef = getConsoleRef();
  if (!consoleRef) {
    return;
  }

  const fn = consoleRef[method];
  if (typeof fn !== 'function') {
    return;
  }

  fn.apply(consoleRef, args as []);
};

export const secureLog = (...args: unknown[]) => callConsole('log', args);
export const secureInfo = (...args: unknown[]) => callConsole('info', args);
export const secureWarn = (...args: unknown[]) => callConsole('warn', args);
export const secureError = (...args: unknown[]) => callConsole('error', args);
export const secureClear = () => callConsole('clear', []);
