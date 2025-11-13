import { type Variants } from 'framer-motion';

/**
 * Centralized animation configurations for consistent motion design
 */

// Default easing curve for smooth animations
export const DEFAULT_EASE: [number, number, number, number] = [
  0.25, 0.1, 0.25, 1,
];

// Animation durations
export const DURATIONS = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

// Animation delays
export const DELAYS = {
  none: 0,
  short: 0.05,
  medium: 0.15,
} as const;

/**
 * Create container variants with staggered children
 */
export const createContainerVariants = (
  prefersReducedMotion: boolean
): Variants => ({
  hidden: { opacity: prefersReducedMotion ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.03,
      delayChildren: 0,
    },
  },
  exit: {
    opacity: prefersReducedMotion ? 1 : 0,
    transition: {
      duration: prefersReducedMotion ? 0 : DURATIONS.fast,
    },
  },
});

/**
 * Create item variants for individual elements
 */
export const createItemVariants = (
  prefersReducedMotion: boolean
): Variants => ({
  hidden: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : DURATIONS.slow,
      ease: DEFAULT_EASE,
    },
  },
  exit: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : -5,
    transition: {
      duration: prefersReducedMotion ? 0 : DURATIONS.fast,
    },
  },
});

/**
 * Create page transition variants
 */
export const createPageVariants = (
  prefersReducedMotion: boolean
): Variants => ({
  initial: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : DURATIONS.normal,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : -10,
    transition: {
      duration: prefersReducedMotion ? 0 : DURATIONS.fast,
    },
  },
});

/**
 * Hover animation props
 */
export const createHoverAnimation = (prefersReducedMotion: boolean) =>
  prefersReducedMotion
    ? {}
    : {
        scale: 1.02,
        y: -2,
        transition: { duration: DURATIONS.fast },
      };

/**
 * Tap animation props
 */
export const createTapAnimation = (prefersReducedMotion: boolean) =>
  prefersReducedMotion ? {} : { scale: 0.98 };

/**
 * Header animation props (for text/page headers)
 */
export const createHeaderAnimation = (
  prefersReducedMotion: boolean,
  ease: [number, number, number, number] = DEFAULT_EASE
) => ({
  initial: { x: prefersReducedMotion ? 0 : -30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: {
    delay: DELAYS.short,
    duration: prefersReducedMotion ? 0 : DURATIONS.slow,
    ease,
  },
});

/**
 * Close button animation props
 */
export const createCloseButtonAnimation = (prefersReducedMotion: boolean) => ({
  whileHover: prefersReducedMotion ? {} : { scale: 1.1, rotate: 90 },
  whileTap: prefersReducedMotion ? {} : { scale: 0.9 },
});
