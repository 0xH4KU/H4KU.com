import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  resetRuntimeCssVarsCache,
  setRuntimeCssVar,
  setRuntimeCssVars,
} from '@/utils/runtimeCssVars';

describe('runtimeCssVars', () => {
  let styleEl: HTMLStyleElement | null = null;

  const mountRuntimeVarsRule = () => {
    styleEl = document.createElement('style');
    styleEl.textContent = "html[data-runtime-vars]{--seed:'0';}";
    document.head.appendChild(styleEl);

    const sheet = styleEl.sheet as CSSStyleSheet | null;
    if (!sheet) {
      throw new Error('Missing stylesheet');
    }
    const rule = sheet.cssRules[0] as CSSStyleRule | undefined;
    if (!rule) {
      throw new Error('Missing css rule');
    }
    return rule;
  };

  beforeEach(() => {
    resetRuntimeCssVarsCache();
  });

  afterEach(() => {
    resetRuntimeCssVarsCache();
    styleEl?.remove();
    styleEl = null;
  });

  it('no-ops when the runtime selector is missing', () => {
    expect(() => setRuntimeCssVar('--vh', '10px')).not.toThrow();
    expect(() => setRuntimeCssVars({ '--vh': '10px', foo: 1 })).not.toThrow();
  });

  it('sets variables on the runtime rule (supports prefixed and unprefixed names)', () => {
    const rule = mountRuntimeVarsRule();

    setRuntimeCssVar('vh', '10px');
    expect(rule.style.getPropertyValue('--vh')).toBe('10px');

    setRuntimeCssVar('--vh', '11px');
    expect(rule.style.getPropertyValue('--vh')).toBe('11px');
  });

  it('sets multiple variables and stringifies numbers', () => {
    const rule = mountRuntimeVarsRule();

    setRuntimeCssVars({
      'tooltip-x': '123px',
      '--tooltip-y': '456px',
      'menu-x': 789,
    });

    expect(rule.style.getPropertyValue('--tooltip-x')).toBe('123px');
    expect(rule.style.getPropertyValue('--tooltip-y')).toBe('456px');
    expect(rule.style.getPropertyValue('--menu-x')).toBe('789');
  });

  it('uses the cached rule on subsequent calls', () => {
    const rule = mountRuntimeVarsRule();

    setRuntimeCssVar('--vh', '10px');
    setRuntimeCssVar('--vh', '12px');

    expect(rule.style.getPropertyValue('--vh')).toBe('12px');
  });
});
