import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  serializePersistedState,
  deserializePersistedState,
  clearPersistedState,
  isManagedPersistenceKey,
  getManagedPersistenceKeys,
  getPersistenceSchema,
} from '@/services/statePersistence';
import { STORAGE_KEYS } from '@/config/constants';

describe('statePersistence', () => {
  const schema = getPersistenceSchema();

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('wraps managed keys with versioned payloads during serialization', () => {
    const serialized = serializePersistedState(
      STORAGE_KEYS.THEME,
      'dark' as const
    );
    expect(JSON.parse(serialized)).toEqual({
      version: schema[STORAGE_KEYS.THEME].version,
      value: 'dark',
    });
  });

  it('serializes unmanaged keys without wrapping payloads', () => {
    const serialized = serializePersistedState('custom:key', {
      nested: true,
    });
    expect(serialized).toBe(JSON.stringify({ nested: true }));
  });

  it('deserializes versioned payloads and respects hydration flags', () => {
    const raw = JSON.stringify({
      version: schema[STORAGE_KEYS.THEME].version - 1,
      value: 'dark',
    });
    const result = deserializePersistedState(
      STORAGE_KEYS.THEME,
      raw,
      'light' as const
    );
    expect(result.value).toBe('dark');
    expect(result.needsHydration).toBe(true);
    expect(result.isCorrupted).toBe(false);
  });

  it('flags corrupted managed payloads and returns fallback value', () => {
    const result = deserializePersistedState(
      STORAGE_KEYS.THEME,
      '{broken json',
      'light' as const
    );
    expect(result.value).toBe('light');
    expect(result.needsHydration).toBe(true);
    expect(result.isCorrupted).toBe(true);
  });

  it('flags corrupted unmanaged payloads without forcing hydration', () => {
    const result = deserializePersistedState('custom:key', '{broken json', {
      foo: 'bar',
    });
    expect(result.value).toEqual({ foo: 'bar' });
    expect(result.needsHydration).toBe(false);
    expect(result.isCorrupted).toBe(true);
  });

  it('clearPersistedState removes all managed keys safely', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.THEME,
      serializePersistedState(STORAGE_KEYS.THEME, 'dark')
    );
    window.localStorage.setItem(
      STORAGE_KEYS.SIDEBAR_WIDTH,
      serializePersistedState(STORAGE_KEYS.SIDEBAR_WIDTH, 320)
    );
    clearPersistedState();
    expect(window.localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH)).toBeNull();
  });

  it('clearPersistedState respects explicit key subsets', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.THEME,
      serializePersistedState(STORAGE_KEYS.THEME, 'dark')
    );
    window.localStorage.setItem(
      STORAGE_KEYS.SIDEBAR_WIDTH,
      serializePersistedState(STORAGE_KEYS.SIDEBAR_WIDTH, 320)
    );

    clearPersistedState([STORAGE_KEYS.THEME]);
    expect(window.localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    expect(
      window.localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH)
    ).not.toBeNull();
  });

  it('clearPersistedState warns when storage removal fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalRemoveItem = window.localStorage.removeItem;
    window.localStorage.removeItem = vi.fn(() => {
      throw new Error('denied');
    });

    clearPersistedState([STORAGE_KEYS.THEME]);
    expect(warnSpy).toHaveBeenCalledWith(
      `[persistence] Unable to clear key "${STORAGE_KEYS.THEME}":`,
      expect.any(Error)
    );

    window.localStorage.removeItem = originalRemoveItem;
    warnSpy.mockRestore();
  });

  it('clearPersistedState no-ops when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(() => clearPersistedState()).not.toThrow();
  });

  it('clearPersistedState no-ops when localStorage is missing', () => {
    vi.stubGlobal('window', {
      ...window,
      localStorage: undefined,
    } as unknown as Window & typeof globalThis);
    expect(() => clearPersistedState()).not.toThrow();
  });

  it('exposes managed persistence keys helpers', () => {
    const managedKeys = getManagedPersistenceKeys();
    expect(managedKeys).toEqual(
      expect.arrayContaining(Object.values(STORAGE_KEYS))
    );
    expect(isManagedPersistenceKey(STORAGE_KEYS.THEME)).toBe(true);
    expect(isManagedPersistenceKey('custom:key')).toBe(false);
  });
});
