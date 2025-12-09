import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EASE,
  DURATIONS,
  DELAYS,
  createContainerVariants,
  createItemVariants,
  createPageVariants,
  createHoverAnimation,
  createTapAnimation,
  createHeaderAnimation,
  createCloseButtonAnimation,
} from '../animations';

describe('animations config', () => {
  describe('constants', () => {
    it('exports DEFAULT_EASE as a valid cubic-bezier array', () => {
      expect(DEFAULT_EASE).toEqual([0.25, 0.1, 0.25, 1]);
    });

    it('exports DURATIONS with expected values', () => {
      expect(DURATIONS.fast).toBe(0.15);
      expect(DURATIONS.normal).toBe(0.2);
      expect(DURATIONS.slow).toBe(0.3);
    });

    it('exports DELAYS with expected values', () => {
      expect(DELAYS.none).toBe(0);
      expect(DELAYS.short).toBe(0.05);
      expect(DELAYS.medium).toBe(0.15);
    });
  });

  describe('createContainerVariants', () => {
    it('returns full animation when prefersReducedMotion is false', () => {
      const variants = createContainerVariants(false);
      expect(variants.hidden).toEqual({ opacity: 0 });
      expect(variants.visible).toMatchObject({
        opacity: 1,
        transition: { staggerChildren: 0.03 },
      });
      expect(variants.exit).toMatchObject({
        opacity: 0,
        transition: { duration: DURATIONS.fast },
      });
    });

    it('returns reduced animation when prefersReducedMotion is true', () => {
      const variants = createContainerVariants(true);
      expect(variants.hidden).toEqual({ opacity: 1 });
      expect(variants.visible).toMatchObject({
        opacity: 1,
        transition: { staggerChildren: 0 },
      });
      expect(variants.exit).toMatchObject({
        opacity: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('createItemVariants', () => {
    it('returns full animation when prefersReducedMotion is false', () => {
      const variants = createItemVariants(false);
      expect(variants.hidden).toEqual({ opacity: 0, y: 10 });
      expect(variants.visible).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: DURATIONS.slow },
      });
      expect(variants.exit).toMatchObject({
        opacity: 0,
        y: -5,
        transition: { duration: DURATIONS.fast },
      });
    });

    it('returns reduced animation when prefersReducedMotion is true', () => {
      const variants = createItemVariants(true);
      expect(variants.hidden).toEqual({ opacity: 1, y: 0 });
      expect(variants.visible).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
      expect(variants.exit).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('createPageVariants', () => {
    it('returns full animation when prefersReducedMotion is false', () => {
      const variants = createPageVariants(false);
      expect(variants.initial).toEqual({ opacity: 0, y: 10 });
      expect(variants.animate).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: DURATIONS.normal },
      });
      expect(variants.exit).toMatchObject({
        opacity: 0,
        y: -10,
        transition: { duration: DURATIONS.fast },
      });
    });

    it('returns reduced animation when prefersReducedMotion is true', () => {
      const variants = createPageVariants(true);
      expect(variants.initial).toEqual({ opacity: 1, y: 0 });
      expect(variants.animate).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
      expect(variants.exit).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('createHoverAnimation', () => {
    it('returns hover animation when prefersReducedMotion is false', () => {
      const animation = createHoverAnimation(false);
      expect(animation).toEqual({
        scale: 1.02,
        y: -2,
        transition: { duration: DURATIONS.fast },
      });
    });

    it('returns empty object when prefersReducedMotion is true', () => {
      const animation = createHoverAnimation(true);
      expect(animation).toEqual({});
    });
  });

  describe('createTapAnimation', () => {
    it('returns tap animation when prefersReducedMotion is false', () => {
      const animation = createTapAnimation(false);
      expect(animation).toEqual({ scale: 0.98 });
    });

    it('returns empty object when prefersReducedMotion is true', () => {
      const animation = createTapAnimation(true);
      expect(animation).toEqual({});
    });
  });

  describe('createHeaderAnimation', () => {
    it('returns full animation when prefersReducedMotion is false', () => {
      const animation = createHeaderAnimation(false);
      expect(animation.initial).toEqual({ x: -30, opacity: 0 });
      expect(animation.animate).toEqual({ x: 0, opacity: 1 });
      expect(animation.transition).toMatchObject({
        duration: DURATIONS.slow,
        ease: DEFAULT_EASE,
      });
    });

    it('returns reduced animation when prefersReducedMotion is true', () => {
      const animation = createHeaderAnimation(true);
      expect(animation.initial).toEqual({ x: 0, opacity: 0 });
      expect(animation.transition).toMatchObject({ duration: 0 });
    });

    it('accepts custom ease', () => {
      const customEase: [number, number, number, number] = [0, 0, 1, 1];
      const animation = createHeaderAnimation(false, customEase);
      expect(animation.transition.ease).toEqual(customEase);
    });
  });

  describe('createCloseButtonAnimation', () => {
    it('returns full animation when prefersReducedMotion is false', () => {
      const animation = createCloseButtonAnimation(false);
      expect(animation.whileHover).toEqual({ scale: 1.1, rotate: 90 });
      expect(animation.whileTap).toEqual({ scale: 0.9 });
    });

    it('returns empty objects when prefersReducedMotion is true', () => {
      const animation = createCloseButtonAnimation(true);
      expect(animation.whileHover).toEqual({});
      expect(animation.whileTap).toEqual({});
    });
  });
});
