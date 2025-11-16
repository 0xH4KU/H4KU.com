import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) {
    return [] as HTMLElement[];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS.join(','))
  ).filter(element => !element.hasAttribute('aria-hidden'));
};

interface UseFocusTrapOptions {
  containerRef: RefObject<HTMLElement | null>;
  active: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
  onEscape?: () => void;
}

export const useFocusTrap = ({
  containerRef,
  active,
  initialFocusRef,
  restoreFocus = true,
  onEscape,
}: UseFocusTrapOptions) => {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      if (restoreFocus) {
        previouslyFocusedElementRef.current?.focus();
      }
      previouslyFocusedElementRef.current = null;
      return;
    }

    /* c8 ignore next */
    if (typeof document === 'undefined') {
      return;
    }

    previouslyFocusedElementRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const focusContainer = () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const initialTarget =
        initialFocusRef?.current || getFocusableElements(container)[0];

      if (initialTarget) {
        initialTarget.focus();
        return;
      }

      if (container.tabIndex === -1) {
        container.focus();
      } else {
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };

    focusContainer();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!activeElement || !containerRef.current.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!activeElement || !containerRef.current.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, initialFocusRef, onEscape, restoreFocus]);
};
