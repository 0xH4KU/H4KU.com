import { useState, useEffect, useRef } from 'react';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = () => {
    if (!isBrowser()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore =
      value instanceof Function ? value(storedValueRef.current) : value;
    setStoredValue(valueToStore);

    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) {
        return;
      }

      try {
        setStoredValue(JSON.parse(event.newValue));
      } catch (error) {
        console.error(`Error parsing storage event for key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
