import { useState, useEffect, useRef, useCallback } from 'react';
import {
  deserializePersistedState,
  serializePersistedState,
} from '@/services/statePersistence';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

interface UseLocalStorageOptions<T> {
  sanitize?: (value: unknown, fallback: T) => T;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const sanitize = options?.sanitize;
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const applySanitizer = useCallback(
    (value: unknown, fallback: T): T => {
      if (!sanitize) {
        return value as T;
      }
      try {
        return sanitize(value, fallback);
      } catch (error) {
        console.error(`Error sanitizing localStorage key "${key}":`, error);
        return fallback;
      }
    },
    [key, sanitize]
  );

  const persistValue = (valueToPersist: unknown) => {
    if (!isBrowser()) {
      return;
    }

    try {
      const serialized = serializePersistedState(key, valueToPersist);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const persistSanitizedValue = (
    original: unknown,
    sanitized: T,
    forceRewrite = false
  ) => {
    if (!sanitize) {
      return;
    }

    if (!forceRewrite && Object.is(original as T, sanitized)) {
      return;
    }

    persistValue(sanitized);
  };

  const readValue = () => {
    if (!isBrowser()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      const { value, needsHydration, isCorrupted } = deserializePersistedState(
        key,
        item,
        initialValue
      );
      const sanitized = applySanitizer(value, initialValue);
      if (isCorrupted) {
        console.error(
          `[useLocalStorage] Corrupted value detected for key "${key}", resetting to fallback.`
        );
        persistValue(sanitized);
        return sanitized;
      }
      persistSanitizedValue(value, sanitized, needsHydration);
      return sanitized;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  const setValue = (value: T | ((prev: T) => T)) => {
    const nextValue =
      value instanceof Function ? value(storedValueRef.current) : value;
    const sanitizedValue = applySanitizer(nextValue, initialValueRef.current);
    setStoredValue(sanitizedValue);

    persistValue(sanitizedValue);
  };

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      try {
        if (event.newValue === null) {
          setStoredValue(initialValueRef.current);
          return;
        }
        const { value, isCorrupted } = deserializePersistedState<T>(
          key,
          event.newValue,
          initialValueRef.current
        );
        if (isCorrupted) {
          console.error(
            `[useLocalStorage] Corrupted storage event for key "${key}", resetting to fallback.`
          );
          setStoredValue(initialValueRef.current);
          try {
            window.localStorage.removeItem(key);
          } catch (cleanupError) {
            console.warn(
              `Unable to clear corrupted localStorage key "${key}":`,
              cleanupError
            );
          }
          return;
        }
        setStoredValue(applySanitizer(value, initialValueRef.current));
      } catch (error) {
        console.error(`Error parsing storage event for key "${key}":`, error);
        setStoredValue(initialValueRef.current);
        try {
          window.localStorage.removeItem(key);
        } catch (cleanupError) {
          console.warn(
            `Unable to reset corrupted localStorage key "${key}":`,
            cleanupError
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, applySanitizer]);

  return [storedValue, setValue];
}
