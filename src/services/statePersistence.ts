import { STORAGE_KEYS } from '@/config/constants';

export type PersistenceKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

interface PersistenceConfig {
  version: number;
  description: string;
  storage: 'localStorage';
}

type PersistedPayload<T> = {
  version: number;
  value: T;
};

const PERSISTENCE_SCHEMA: Record<PersistenceKey, PersistenceConfig> = {
  [STORAGE_KEYS.THEME]: {
    version: 1,
    description: 'User-selected theme preference',
    storage: 'localStorage',
  },
  [STORAGE_KEYS.SIDEBAR_WIDTH]: {
    version: 1,
    description: 'Resizable sidebar width',
    storage: 'localStorage',
  },
  [STORAGE_KEYS.EXPANDED_FOLDERS]: {
    version: 1,
    description: 'Memoized expanded folder ids',
    storage: 'localStorage',
  },
  [STORAGE_KEYS.PINNED_ITEMS]: {
    version: 1,
    description: 'Pinned items within the sidebar',
    storage: 'localStorage',
  },
};

const MANAGED_KEYS: readonly PersistenceKey[] = [
  STORAGE_KEYS.THEME,
  STORAGE_KEYS.SIDEBAR_WIDTH,
  STORAGE_KEYS.EXPANDED_FOLDERS,
  STORAGE_KEYS.PINNED_ITEMS,
];

const managedKeySet = new Set<string>(MANAGED_KEYS);

const isPersistedPayload = (
  value: unknown
): value is PersistedPayload<unknown> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.version === 'number' && 'value' in record;
};

export const isManagedPersistenceKey = (key: string): key is PersistenceKey =>
  managedKeySet.has(key);

export const serializePersistedState = <T>(key: string, value: T): string => {
  if (!isManagedPersistenceKey(key)) {
    return JSON.stringify(value);
  }

  const config = PERSISTENCE_SCHEMA[key];
  const payload: PersistedPayload<T> = {
    version: config.version,
    value,
  };

  return JSON.stringify(payload);
};

type DeserializedState<T> = {
  value: T;
  needsHydration: boolean;
  isCorrupted: boolean;
};

export const deserializePersistedState = (
  key: string,
  rawValue: string,
  fallback: unknown
): DeserializedState<unknown> => {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (isManagedPersistenceKey(key) && isPersistedPayload(parsed)) {
      const config = PERSISTENCE_SCHEMA[key];
      return {
        value: parsed.value,
        needsHydration: parsed.version !== config.version,
        isCorrupted: false,
      };
    }
    return {
      value: parsed,
      needsHydration: isManagedPersistenceKey(key),
      isCorrupted: false,
    };
  } catch {
    return {
      value: fallback,
      needsHydration: isManagedPersistenceKey(key),
      isCorrupted: true,
    };
  }
};

export const clearPersistedState = (keys?: PersistenceKey[]) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const keysToClear = keys ?? Array.from(MANAGED_KEYS);
  keysToClear.forEach(key => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[persistence] Unable to clear key "${key}":`, error);
    }
  });
};

export const getPersistenceSchema = () => ({ ...PERSISTENCE_SCHEMA });

export const getManagedPersistenceKeys = () => Array.from(MANAGED_KEYS);
