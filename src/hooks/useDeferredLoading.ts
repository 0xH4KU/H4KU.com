import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Default delay before showing loading indicators (in milliseconds).
 * Based on Apple App Store's pattern to avoid UI flashing for fast operations.
 */
export const DEFAULT_LOADING_DELAY = 500;

interface UseDeferredLoadingOptions {
  /** Delay in ms before showing loading indicator. Default: 500ms */
  delay?: number;
  /** Minimum time to show loading indicator once shown. Default: 300ms */
  minDuration?: number;
}

interface UseDeferredLoadingResult {
  /** Whether loading indicator should be shown */
  showLoading: boolean;
  /** Start loading state */
  startLoading: () => void;
  /** End loading state */
  endLoading: () => void;
  /** Whether operation is in progress (regardless of UI state) */
  isLoading: boolean;
}

/**
 * Hook for deferred loading states to avoid UI flashing.
 * Only shows loading indicator after a delay threshold.
 * Once shown, maintains loading state for a minimum duration to avoid flicker.
 *
 * @example
 * const { showLoading, startLoading, endLoading } = useDeferredLoading({ delay: 500 });
 *
 * async function fetchData() {
 *   startLoading();
 *   try {
 *     await api.getData();
 *   } finally {
 *     endLoading();
 *   }
 * }
 *
 * return showLoading ? <Spinner /> : <Content />;
 */
export function useDeferredLoading({
  delay = DEFAULT_LOADING_DELAY,
  minDuration = 300,
}: UseDeferredLoadingOptions = {}): UseDeferredLoadingResult {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingStartTimeRef = useRef<number>(0);
  const showLoadingRef = useRef(false); // Track actual showing state

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (minDurationTimeoutRef.current) {
      clearTimeout(minDurationTimeoutRef.current);
      minDurationTimeoutRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    setIsLoading(true);

    // Start timeout to show loading after delay
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true);
      showLoadingRef.current = true;
      loadingStartTimeRef.current = Date.now();
      timeoutRef.current = null;
    }, delay);
  }, [delay]);

  const endLoading = useCallback(() => {
    setIsLoading(false);

    if (timeoutRef.current) {
      // Loading finished before delay - never show indicator
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setShowLoading(false);
      showLoadingRef.current = false;
    } else if (showLoadingRef.current) {
      // Loading indicator is visible - ensure minimum duration
      const elapsed = Date.now() - loadingStartTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        minDurationTimeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          showLoadingRef.current = false;
        }, remaining);
      } else {
        setShowLoading(false);
        showLoadingRef.current = false;
      }
    }
  }, [minDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    showLoading,
    startLoading,
    endLoading,
    isLoading,
  };
}

/**
 * Hook for async operations with deferred loading.
 * Automatically manages loading state based on promise lifecycle.
 *
 * @example
 * const { execute, showLoading, error } = useDeferredAsync();
 *
 * const handleClick = () => {
 *   execute(async () => {
 *     const data = await fetchData();
 *     setData(data);
 *   });
 * };
 */
export function useDeferredAsync<T = void>({
  delay = DEFAULT_LOADING_DELAY,
  minDuration = 300,
}: UseDeferredLoadingOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const { showLoading, startLoading, endLoading, isLoading } = useDeferredLoading({
    delay,
    minDuration,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | undefined> => {
      setError(null);
      startLoading();

      try {
        const result = await asyncFn();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        endLoading();
      }
    },
    [startLoading, endLoading]
  );

  return {
    execute,
    showLoading,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Utility to create a promise that resolves after a minimum time.
 * Useful for ensuring minimum loading durations.
 *
 * @example
 * const data = await withMinDuration(fetchData(), 500);
 */
export async function withMinDuration<T>(
  promise: Promise<T>,
  minDuration: number
): Promise<T> {
  const startTime = Date.now();
  const result = await promise;
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minDuration - elapsed);

  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }

  return result;
}

/**
 * Utility to delay showing content until after a threshold.
 * Returns null before threshold, then the value.
 *
 * @example
 * const { value: deferredLoading } = useDeferredValue(isLoading, { delay: 500 });
 * return deferredLoading ? <Spinner /> : <Content />;
 */
export function useDeferredValue<T>(
  value: T,
  { delay = DEFAULT_LOADING_DELAY }: { delay?: number } = {}
): { value: T | null; isDeferred: boolean } {
  const [deferredValue, setDeferredValue] = useState<T | null>(null);
  const [isDeferred, setIsDeferred] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If value becomes falsy, reset immediately
    if (!value) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setDeferredValue(null);
      setIsDeferred(true);
      return;
    }

    // If value becomes truthy, delay before showing
    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
      setIsDeferred(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return { value: deferredValue, isDeferred };
}
