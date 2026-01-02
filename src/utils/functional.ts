/**
 * Advanced utility functions inspired by Apple App Store patterns.
 */

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Makes properties from T that are in U optional and vice versa.
 * Useful for mutually exclusive props.
 */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

/**
 * XOR type - ensures exactly one of two types is provided.
 * Use for mutually exclusive props in components.
 *
 * @example
 * type Props = XOR<{ href: string }, { onClick: () => void }>;
 * // Valid: { href: '/path' } or { onClick: () => {} }
 * // Invalid: { href: '/path', onClick: () => {} } or {}
 */
export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

/**
 * Make specific properties required
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Partition an array into two arrays based on a predicate.
 * First array contains items where predicate returns true,
 * second array contains items where predicate returns false.
 *
 * @example
 * const [even, odd] = partition([1, 2, 3, 4], n => n % 2 === 0);
 * // even = [2, 4], odd = [1, 3]
 */
export function partition<T>(
  input: readonly T[],
  predicate: (element: T, index: number) => boolean
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (let i = 0; i < input.length; i++) {
    const element = input[i];
    if (predicate(element, i)) {
      pass.push(element);
    } else {
      fail.push(element);
    }
  }

  return [pass, fail];
}

/**
 * Group array items by a key function.
 *
 * @example
 * const grouped = groupBy([{type: 'a', v: 1}, {type: 'b', v: 2}, {type: 'a', v: 3}], x => x.type);
 * // { a: [{type: 'a', v: 1}, {type: 'a', v: 3}], b: [{type: 'b', v: 2}] }
 */
export function groupBy<T, K extends string | number>(
  input: readonly T[],
  keyFn: (element: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const element of input) {
    const key = keyFn(element);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(element);
  }

  return result;
}

/**
 * Get unique items from an array based on a key function.
 *
 * @example
 * const unique = uniqueBy([{id: 1}, {id: 2}, {id: 1}], x => x.id);
 * // [{id: 1}, {id: 2}]
 */
export function uniqueBy<T, K>(
  input: readonly T[],
  keyFn: (element: T) => K
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const element of input) {
    const key = keyFn(element);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(element);
    }
  }

  return result;
}

/**
 * Create a range of numbers.
 *
 * @example
 * range(5) // [0, 1, 2, 3, 4]
 * range(2, 5) // [2, 3, 4]
 * range(0, 10, 2) // [0, 2, 4, 6, 8]
 */
export function range(end: number): number[];
export function range(start: number, end: number, step?: number): number[];
export function range(startOrEnd: number, end?: number, step = 1): number[] {
  const [actualStart, actualEnd] = end === undefined ? [0, startOrEnd] : [startOrEnd, end];
  const result: number[] = [];

  for (let i = actualStart; i < actualEnd; i += step) {
    result.push(i);
  }

  return result;
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate text intelligently at sentence or word boundaries.
 * Uses Intl.Segmenter for locale-aware segmentation.
 *
 * @example
 * truncateText("Hello world. This is a test.", 15) // "Hello world..."
 */
export function truncateText(
  text: string,
  limit: number,
  locale = 'en-US',
  ellipsis = '...'
): string {
  if (text.length <= limit) {
    return text;
  }

  // Try to break at sentence boundaries first
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' });
      const sentences = Array.from(segmenter.segment(text));

      let result = '';
      for (const { segment } of sentences) {
        if ((result + segment).length <= limit - ellipsis.length) {
          result += segment;
        } else {
          break;
        }
      }

      if (result.length > 0) {
        return result.trim() + ellipsis;
      }
    } catch {
      // Fall through to word-based truncation
    }
  }

  // Fall back to word boundary truncation
  const truncated = text.slice(0, limit - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > limit * 0.5) {
    return truncated.slice(0, lastSpace).trim() + ellipsis;
  }

  return truncated.trim() + ellipsis;
}

/**
 * Format a list of items with locale-aware conjunction.
 *
 * @example
 * formatList(['apple', 'banana', 'cherry'], 'en') // "apple, banana, and cherry"
 * formatList(['apple', 'banana'], 'en') // "apple and banana"
 */
export function formatList(
  items: readonly string[],
  locale = 'en',
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];

  if (typeof Intl !== 'undefined' && 'ListFormat' in Intl) {
    try {
      return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
    } catch {
      // Fall through to manual formatting
    }
  }

  // Manual fallback
  if (items.length === 2) {
    const conj = type === 'conjunction' ? 'and' : 'or';
    return `${items[0]} ${conj} ${items[1]}`;
  }

  const conj = type === 'conjunction' ? 'and' : 'or';
  const allButLast = items.slice(0, -1).join(', ');
  return `${allButLast}, ${conj} ${items[items.length - 1]}`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string to kebab-case.
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to camelCase.
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Pick specific keys from an object.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Create an object from entries with type safety.
 */
export function fromEntries<K extends string | number | symbol, V>(
  entries: readonly (readonly [K, V])[]
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

// ============================================================================
// Function Utilities
// ============================================================================

/**
 * Memoize a function with a single argument.
 */
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Create a debounced version of a function.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Create a throttled version of a function.
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Execute a function only once.
 */
export function once<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T>;

  return (...args: Parameters<T>) => {
    if (called) {
      return result;
    }
    called = true;
    result = fn(...args);
    return result;
  };
}
