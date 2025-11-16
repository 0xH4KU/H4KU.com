import { useState, useEffect, useRef, useCallback } from 'react';

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

  const persistSanitizedValue = (original: unknown, sanitized: T) => {
    if (!sanitize || !isBrowser()) {
      return;
    }

    if (Object.is(original as T, sanitized)) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(sanitized));
    } catch (error) {
      console.error(
        `Error persisting sanitized localStorage key "${key}":`,
        error
      );
    }
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
      const parsed = JSON.parse(item) as unknown;
      const sanitized = applySanitizer(parsed, initialValue);
      persistSanitizedValue(parsed, sanitized);
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

    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(sanitizedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
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
        const parsed = JSON.parse(event.newValue) as unknown;
        setStoredValue(applySanitizer(parsed, initialValueRef.current));
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
