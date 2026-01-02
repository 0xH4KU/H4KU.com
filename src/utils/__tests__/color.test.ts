import { describe, it, expect } from 'vitest';
import {
  parseRgbString,
  parseRgbaString,
  parseHexString,
  parseColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getLuminance,
  getSimpleLuminance,
  getContrastRatio,
  isDarkColor,
  isLightColor,
  meetsContrastAA,
  meetsContrastAAA,
  mixColors,
  lighten,
  darken,
  adjustSaturation,
  adjustLightness,
  getComplementary,
  isGrey,
  toCssRgb,
  toCssRgba,
  generateColorVars,
  getContrastTextColor,
  generateGradient,
} from '../color';

describe('color utilities', () => {
  describe('Parsing', () => {
    describe('parseRgbString', () => {
      it('parses rgb format', () => {
        expect(parseRgbString('rgb(255, 0, 128)')).toEqual([255, 0, 128]);
      });

      it('parses rgba format (ignoring alpha)', () => {
        expect(parseRgbString('rgba(255, 0, 128, 0.5)')).toEqual([255, 0, 128]);
      });

      it('handles spaces', () => {
        expect(parseRgbString('rgb( 255 , 0 , 128 )')).toEqual([255, 0, 128]);
      });

      it('returns null for invalid format', () => {
        expect(parseRgbString('invalid')).toBeNull();
        expect(parseRgbString('rgb(300, 0, 0)')).toBeNull();
      });
    });

    describe('parseRgbaString', () => {
      it('parses rgba with alpha', () => {
        expect(parseRgbaString('rgba(255, 0, 128, 0.5)')).toEqual([255, 0, 128, 0.5]);
      });

      it('defaults alpha to 1 for rgb', () => {
        expect(parseRgbaString('rgb(255, 0, 128)')).toEqual([255, 0, 128, 1]);
      });
    });

    describe('parseHexString', () => {
      it('parses 6-digit hex', () => {
        expect(parseHexString('#ff0080')).toEqual([255, 0, 128]);
      });

      it('parses 3-digit hex', () => {
        expect(parseHexString('#f08')).toEqual([255, 0, 136]);
      });

      it('parses without hash', () => {
        expect(parseHexString('ff0080')).toEqual([255, 0, 128]);
      });

      it('parses 8-digit hex (ignoring alpha)', () => {
        expect(parseHexString('#ff0080ff')).toEqual([255, 0, 128]);
      });

      it('returns null for invalid format', () => {
        expect(parseHexString('invalid')).toBeNull();
        expect(parseHexString('#gg0000')).toBeNull();
      });
    });

    describe('parseColor', () => {
      it('parses hex colors', () => {
        expect(parseColor('#ff0000')).toEqual([255, 0, 0]);
      });

      it('parses rgb colors', () => {
        expect(parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0]);
      });

      it('returns null for unknown format', () => {
        expect(parseColor('red')).toBeNull();
      });
    });
  });

  describe('Conversion', () => {
    describe('rgbToHex', () => {
      it('converts RGB to hex', () => {
        expect(rgbToHex([255, 0, 128])).toBe('#ff0080');
      });

      it('pads single digits', () => {
        expect(rgbToHex([0, 0, 0])).toBe('#000000');
        expect(rgbToHex([15, 15, 15])).toBe('#0f0f0f');
      });
    });

    describe('rgbToHsl', () => {
      it('converts red', () => {
        expect(rgbToHsl([255, 0, 0])).toEqual([0, 100, 50]);
      });

      it('converts green', () => {
        expect(rgbToHsl([0, 255, 0])).toEqual([120, 100, 50]);
      });

      it('converts blue', () => {
        expect(rgbToHsl([0, 0, 255])).toEqual([240, 100, 50]);
      });

      it('converts white', () => {
        expect(rgbToHsl([255, 255, 255])).toEqual([0, 0, 100]);
      });

      it('converts black', () => {
        expect(rgbToHsl([0, 0, 0])).toEqual([0, 0, 0]);
      });
    });

    describe('hslToRgb', () => {
      it('converts red', () => {
        expect(hslToRgb([0, 100, 50])).toEqual([255, 0, 0]);
      });

      it('converts green', () => {
        expect(hslToRgb([120, 100, 50])).toEqual([0, 255, 0]);
      });

      it('converts grey (0 saturation)', () => {
        expect(hslToRgb([0, 0, 50])).toEqual([128, 128, 128]);
      });
    });
  });

  describe('Luminance & Contrast', () => {
    describe('getLuminance', () => {
      it('returns 0 for black', () => {
        expect(getLuminance([0, 0, 0])).toBe(0);
      });

      it('returns 1 for white', () => {
        expect(getLuminance([255, 255, 255])).toBe(1);
      });

      it('returns intermediate value for grey', () => {
        const lum = getLuminance([128, 128, 128]);
        expect(lum).toBeGreaterThan(0.2);
        expect(lum).toBeLessThan(0.3);
      });
    });

    describe('getSimpleLuminance', () => {
      it('returns 0 for black', () => {
        expect(getSimpleLuminance([0, 0, 0])).toBe(0);
      });

      it('returns ~255 for white', () => {
        expect(getSimpleLuminance([255, 255, 255])).toBeCloseTo(255, 0);
      });
    });

    describe('getContrastRatio', () => {
      it('returns 21 for black and white', () => {
        const ratio = getContrastRatio([0, 0, 0], [255, 255, 255]);
        expect(ratio).toBeCloseTo(21, 0);
      });

      it('returns 1 for same colors', () => {
        const ratio = getContrastRatio([128, 128, 128], [128, 128, 128]);
        expect(ratio).toBe(1);
      });
    });

    describe('isDarkColor', () => {
      it('returns true for black', () => {
        expect(isDarkColor([0, 0, 0])).toBe(true);
      });

      it('returns false for white', () => {
        expect(isDarkColor([255, 255, 255])).toBe(false);
      });
    });

    describe('isLightColor', () => {
      it('returns false for black', () => {
        expect(isLightColor([0, 0, 0])).toBe(false);
      });

      it('returns true for white', () => {
        expect(isLightColor([255, 255, 255])).toBe(true);
      });
    });

    describe('meetsContrastAA', () => {
      it('returns true for black on white', () => {
        expect(meetsContrastAA([0, 0, 0], [255, 255, 255])).toBe(true);
      });

      it('returns false for light grey on white', () => {
        expect(meetsContrastAA([200, 200, 200], [255, 255, 255])).toBe(false);
      });
    });

    describe('meetsContrastAAA', () => {
      it('returns true for black on white', () => {
        expect(meetsContrastAAA([0, 0, 0], [255, 255, 255])).toBe(true);
      });
    });
  });

  describe('Color Manipulation', () => {
    describe('mixColors', () => {
      it('mixes two colors equally', () => {
        const result = mixColors([255, 0, 0], [0, 0, 255], 0.5);
        expect(result).toEqual([128, 0, 128]);
      });

      it('returns first color at ratio 0', () => {
        expect(mixColors([255, 0, 0], [0, 0, 255], 0)).toEqual([255, 0, 0]);
      });

      it('returns second color at ratio 1', () => {
        expect(mixColors([255, 0, 0], [0, 0, 255], 1)).toEqual([0, 0, 255]);
      });
    });

    describe('lighten', () => {
      it('lightens a color', () => {
        const result = lighten([100, 100, 100], 50);
        expect(result[0]).toBeGreaterThan(100);
      });
    });

    describe('darken', () => {
      it('darkens a color', () => {
        const result = darken([200, 200, 200], 50);
        expect(result[0]).toBeLessThan(200);
      });
    });

    describe('adjustSaturation', () => {
      it('can increase saturation', () => {
        const original = [150, 100, 100] as [number, number, number];
        const result = adjustSaturation(original, 20);
        const originalHsl = rgbToHsl(original);
        const resultHsl = rgbToHsl(result);
        expect(resultHsl[1]).toBeGreaterThanOrEqual(originalHsl[1]);
      });
    });

    describe('adjustLightness', () => {
      it('can increase lightness', () => {
        const original = [100, 100, 100] as [number, number, number];
        const result = adjustLightness(original, 20);
        const originalHsl = rgbToHsl(original);
        const resultHsl = rgbToHsl(result);
        expect(resultHsl[2]).toBeGreaterThan(originalHsl[2]);
      });
    });

    describe('getComplementary', () => {
      it('returns complementary color', () => {
        const red: [number, number, number] = [255, 0, 0];
        const result = getComplementary(red);
        // Red's complement should be cyan-ish
        expect(result[0]).toBeLessThan(50);
        expect(result[1]).toBeGreaterThan(200);
        expect(result[2]).toBeGreaterThan(200);
      });
    });

    describe('isGrey', () => {
      it('returns true for grey colors', () => {
        expect(isGrey([128, 128, 128])).toBe(true);
      });

      it('returns false for saturated colors', () => {
        expect(isGrey([255, 0, 0])).toBe(false);
      });
    });
  });

  describe('CSS Helpers', () => {
    describe('toCssRgb', () => {
      it('generates rgb() string', () => {
        expect(toCssRgb([255, 0, 128])).toBe('rgb(255, 0, 128)');
      });
    });

    describe('toCssRgba', () => {
      it('generates rgba() string', () => {
        expect(toCssRgba([255, 0, 128, 0.5])).toBe('rgba(255, 0, 128, 0.5)');
      });
    });

    describe('generateColorVars', () => {
      it('generates CSS custom properties', () => {
        const vars = generateColorVars('primary', [255, 0, 128]);
        expect(vars['--primary']).toBe('#ff0080');
        expect(vars['--primary-rgb']).toBe('255, 0, 128');
        expect(vars['--primary-50']).toBe('rgba(255, 0, 128, 0.5)');
      });
    });

    describe('getContrastTextColor', () => {
      it('returns white for dark backgrounds', () => {
        expect(getContrastTextColor([0, 0, 0])).toEqual([255, 255, 255]);
      });

      it('returns black for light backgrounds', () => {
        expect(getContrastTextColor([255, 255, 255])).toEqual([0, 0, 0]);
      });
    });

    describe('generateGradient', () => {
      it('generates linear gradient', () => {
        const gradient = generateGradient([
          [255, 0, 0],
          [0, 0, 255],
        ]);
        expect(gradient).toContain('linear-gradient');
        expect(gradient).toContain('to right');
        expect(gradient).toContain('rgb(255, 0, 0)');
        expect(gradient).toContain('rgb(0, 0, 255)');
      });
    });
  });
});
