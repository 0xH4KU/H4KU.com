import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { STORAGE_KEYS } from '@/config/constants';

const createWrapper =
  () =>
  ({ children }: { children: ReactNode }) =>
    <ThemeProvider>{children}</ThemeProvider>;

const setupMatchMedia = (matches: boolean) => {
  const queryMock = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(queryMock),
  });

  return queryMock;
};

describe('ThemeProvider', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('provides theme values and toggles stored preference', () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBe('light');
    expect(result.current.systemTheme).toBe('light');
    expect(result.current.hasStoredTheme).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(result.current.hasStoredTheme).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEYS.THEME)).toBe('"dark"');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });

  it('applies system dark theme and updates DOM metadata', async () => {
    setupMatchMedia(true);

    vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
      const theme = element.getAttribute('data-theme') || 'light';
      const color = theme === 'dark' ? '#111111' : '#ffffff';
      return {
        getPropertyValue: () => color,
      } as CSSStyleDeclaration;
    });

    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    );

    expect(result.current.theme).toBe('dark');
    expect(document.body?.getAttribute('data-theme')).toBe('dark');

    const lightMeta = document.querySelector(
      'meta[name="theme-color"][media*="light"]'
    );
    const darkMeta = document.querySelector(
      'meta[name="theme-color"][media*="dark"]'
    );
    expect(lightMeta).not.toBeNull();
    expect(darkMeta).not.toBeNull();
  });
});

describe('useTheme', () => {
  it('throws outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      /must be used within ThemeProvider/i
    );
  });
});
