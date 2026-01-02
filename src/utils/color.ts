/**
 * Color manipulation utilities inspired by Apple App Store patterns.
 * Provides functions for color parsing, conversion, and accessibility checks.
 */

// ============================================================================
// Types
// ============================================================================

export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];
export type HSL = [number, number, number];
export type HEX = `#${string}`;

export interface ColorComponents {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse an RGB/RGBA string into components.
 * Supports formats: rgb(255, 0, 128), rgba(255, 0, 128, 0.5)
 */
export function parseRgbString(rgbString: string): RGB | null {
  const match = rgbString.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i
  );

  if (!match) return null;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  if (r > 255 || g > 255 || b > 255) return null;

  return [r, g, b];
}

/**
 * Parse an RGBA string into components including alpha.
 */
export function parseRgbaString(rgbaString: string): RGBA | null {
  const match = rgbaString.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i
  );

  if (!match) return null;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : 1;

  if (r > 255 || g > 255 || b > 255 || a > 1) return null;

  return [r, g, b, a];
}

/**
 * Parse a hex color string into RGB components.
 * Supports formats: #RGB, #RRGGBB, #RRGGBBAA
 */
export function parseHexString(hex: string): RGB | null {
  const cleaned = hex.replace('#', '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6 || cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  return [r, g, b];
}

/**
 * Parse any color string format into RGB.
 */
export function parseColor(color: string): RGB | null {
  if (color.startsWith('#')) {
    return parseHexString(color);
  }
  if (color.startsWith('rgb')) {
    return parseRgbString(color);
  }
  return null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert RGB to hex string.
 */
export function rgbToHex([r, g, b]: RGB): HEX {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL.
 */
export function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert HSL to RGB.
 */
export function hslToRgb([h, s, l]: HSL): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

// ============================================================================
// Luminance & Contrast
// ============================================================================

/**
 * Calculate the relative luminance of an RGB color.
 * Uses the WCAG formula for sRGB.
 * Returns a value between 0 (darkest) and 1 (lightest).
 */
export function getLuminance([r, g, b]: RGB): number {
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Simplified luminance calculation (faster but less accurate).
 * Returns a value between 0 and 255.
 */
export function getSimpleLuminance([r, g, b]: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate the contrast ratio between two colors.
 * Returns a value between 1 (no contrast) and 21 (max contrast).
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if the color is considered "dark" (low luminance).
 */
export function isDarkColor(color: RGB, threshold = 128): boolean {
  return getSimpleLuminance(color) < threshold;
}

/**
 * Check if the color is considered "light" (high luminance).
 */
export function isLightColor(color: RGB, threshold = 128): boolean {
  return getSimpleLuminance(color) >= threshold;
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text).
 */
export function meetsContrastAA(color1: RGB, color2: RGB): boolean {
  return getContrastRatio(color1, color2) >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text).
 */
export function meetsContrastAAA(color1: RGB, color2: RGB): boolean {
  return getContrastRatio(color1, color2) >= 7;
}

// ============================================================================
// Color Manipulation
// ============================================================================

/**
 * Mix two colors together with a given ratio.
 * ratio of 0 = color1, ratio of 1 = color2.
 */
export function mixColors(color1: RGB, color2: RGB, ratio = 0.5): RGB {
  const r = Math.round(color1[0] * (1 - ratio) + color2[0] * ratio);
  const g = Math.round(color1[1] * (1 - ratio) + color2[1] * ratio);
  const b = Math.round(color1[2] * (1 - ratio) + color2[2] * ratio);
  return [r, g, b];
}

/**
 * Lighten a color by a percentage.
 */
export function lighten(color: RGB, amount: number): RGB {
  return mixColors(color, [255, 255, 255], amount / 100);
}

/**
 * Darken a color by a percentage.
 */
export function darken(color: RGB, amount: number): RGB {
  return mixColors(color, [0, 0, 0], amount / 100);
}

/**
 * Adjust the saturation of a color.
 * Positive values increase saturation, negative values decrease.
 */
export function adjustSaturation(color: RGB, amount: number): RGB {
  const hsl = rgbToHsl(color);
  hsl[1] = Math.max(0, Math.min(100, hsl[1] + amount));
  return hslToRgb(hsl);
}

/**
 * Adjust the lightness of a color.
 * Positive values increase lightness, negative values decrease.
 */
export function adjustLightness(color: RGB, amount: number): RGB {
  const hsl = rgbToHsl(color);
  hsl[2] = Math.max(0, Math.min(100, hsl[2] + amount));
  return hslToRgb(hsl);
}

/**
 * Get the complementary color (opposite on the color wheel).
 */
export function getComplementary(color: RGB): RGB {
  const hsl = rgbToHsl(color);
  hsl[0] = (hsl[0] + 180) % 360;
  return hslToRgb(hsl);
}

/**
 * Check if a color is considered "grey" (low saturation).
 */
export function isGrey(color: RGB, threshold = 10): boolean {
  const hsl = rgbToHsl(color);
  return hsl[1] < threshold;
}

// ============================================================================
// CSS Helpers
// ============================================================================

/**
 * Convert RGB to CSS rgb() string.
 */
export function toCssRgb([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert RGBA to CSS rgba() string.
 */
export function toCssRgba([r, g, b, a]: RGBA): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Generate CSS custom properties for a color with opacity variants.
 */
export function generateColorVars(
  name: string,
  color: RGB
): Record<string, string> {
  const hex = rgbToHex(color);
  return {
    [`--${name}`]: hex,
    [`--${name}-rgb`]: color.join(', '),
    [`--${name}-10`]: toCssRgba([...color, 0.1]),
    [`--${name}-20`]: toCssRgba([...color, 0.2]),
    [`--${name}-50`]: toCssRgba([...color, 0.5]),
    [`--${name}-80`]: toCssRgba([...color, 0.8]),
  };
}

/**
 * Get the best text color (black or white) for a given background.
 */
export function getContrastTextColor(background: RGB): RGB {
  return isDarkColor(background) ? [255, 255, 255] : [0, 0, 0];
}

/**
 * Generate a gradient CSS string from an array of colors.
 */
export function generateGradient(
  colors: RGB[],
  direction = 'to right'
): string {
  const stops = colors.map((c, i) => {
    const percent = (i / (colors.length - 1)) * 100;
    return `${toCssRgb(c)} ${percent}%`;
  });
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
}
