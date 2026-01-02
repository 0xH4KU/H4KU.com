import { useEffect, useMemo, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DATASET_KEY = 'sidebarTabindex';
const DATASET_NONE = '__sidebar_none__';

const hasInertSupport = (): boolean => {
  if (typeof HTMLElement === 'undefined') {
    return false;
  }
  return 'inert' in (HTMLElement.prototype as HTMLElement & { inert?: unknown });
};

interface UseInertFallbackOptions {
  containerRef: RefObject<HTMLElement | null>;
  isInert: boolean;
}

interface UseInertFallbackResult {
  supportsInert: boolean;
  inertProps: { inert?: true };
}

/**
 * Provides a fallback for the `inert` attribute in browsers that don't support it.
 * When inert is not supported, it manually manages tabindex and aria-hidden
 * on all focusable elements within the container.
 */
export function useInertFallback({
  containerRef,
  isInert,
}: UseInertFallbackOptions): UseInertFallbackResult {
  const supportsInert = useMemo(() => hasInertSupport(), []);

  useEffect(() => {
    if (supportsInert || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const updateFocusableElements = (disable: boolean) => {
      const focusableElements =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      focusableElements.forEach(element => {
        if (disable) {
          if (!element.dataset[DATASET_KEY]) {
            const existing = element.getAttribute('tabindex');
            element.dataset[DATASET_KEY] = existing ?? DATASET_NONE;
          }
          element.setAttribute('tabindex', '-1');
          element.setAttribute('aria-hidden', 'true');
        } else {
          const stored = element.dataset[DATASET_KEY];
          if (stored) {
            if (stored !== DATASET_NONE) {
              element.setAttribute('tabindex', stored);
            } else {
              element.removeAttribute('tabindex');
            }
            delete element.dataset[DATASET_KEY];
          } else {
            element.removeAttribute('tabindex');
          }
          element.removeAttribute('aria-hidden');
        }
      });
    };

    updateFocusableElements(isInert);

    let observer: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        updateFocusableElements(isInert);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer?.disconnect();
      updateFocusableElements(false);
    };
  }, [supportsInert, isInert, containerRef]);

  const inertProps = supportsInert && isInert ? { inert: true as const } : {};

  return {
    supportsInert,
    inertProps,
  };
}
