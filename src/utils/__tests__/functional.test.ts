import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  partition,
  groupBy,
  uniqueBy,
  range,
  truncateText,
  formatList,
  capitalize,
  toKebabCase,
  toCamelCase,
  pick,
  omit,
  fromEntries,
  memoize,
  debounce,
  throttle,
  once,
} from '../functional';

describe('functional utilities', () => {
  describe('Array utilities', () => {
    describe('partition', () => {
      it('partitions array based on predicate', () => {
        const [even, odd] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
        expect(even).toEqual([2, 4]);
        expect(odd).toEqual([1, 3, 5]);
      });

      it('handles empty array', () => {
        const [pass, fail] = partition([], () => true);
        expect(pass).toEqual([]);
        expect(fail).toEqual([]);
      });

      it('passes index to predicate', () => {
        const [pass] = partition(['a', 'b', 'c'], (_, i) => i === 1);
        expect(pass).toEqual(['b']);
      });

      it('handles all pass case', () => {
        const [pass, fail] = partition([1, 2, 3], () => true);
        expect(pass).toEqual([1, 2, 3]);
        expect(fail).toEqual([]);
      });

      it('handles all fail case', () => {
        const [pass, fail] = partition([1, 2, 3], () => false);
        expect(pass).toEqual([]);
        expect(fail).toEqual([1, 2, 3]);
      });
    });

    describe('groupBy', () => {
      it('groups items by key function', () => {
        const input = [
          { type: 'a', value: 1 },
          { type: 'b', value: 2 },
          { type: 'a', value: 3 },
        ];
        const result = groupBy(input, x => x.type);
        expect(result).toEqual({
          a: [
            { type: 'a', value: 1 },
            { type: 'a', value: 3 },
          ],
          b: [{ type: 'b', value: 2 }],
        });
      });

      it('handles empty array', () => {
        const result = groupBy([], () => 'key');
        expect(result).toEqual({});
      });

      it('handles numeric keys', () => {
        const result = groupBy([1, 2, 3, 4], n => n % 2);
        expect(result).toEqual({
          0: [2, 4],
          1: [1, 3],
        });
      });
    });

    describe('uniqueBy', () => {
      it('returns unique items by key', () => {
        const input = [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }];
        const result = uniqueBy(input, x => x.id);
        expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      });

      it('preserves order of first occurrence', () => {
        const input = ['a', 'b', 'a', 'c', 'b'];
        const result = uniqueBy(input, x => x);
        expect(result).toEqual(['a', 'b', 'c']);
      });

      it('handles empty array', () => {
        expect(uniqueBy([], x => x)).toEqual([]);
      });
    });

    describe('range', () => {
      it('creates range from 0 to n', () => {
        expect(range(5)).toEqual([0, 1, 2, 3, 4]);
      });

      it('creates range from start to end', () => {
        expect(range(2, 6)).toEqual([2, 3, 4, 5]);
      });

      it('creates range with custom step', () => {
        expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
      });

      it('handles empty range', () => {
        expect(range(0)).toEqual([]);
        expect(range(5, 5)).toEqual([]);
      });
    });
  });

  describe('String utilities', () => {
    describe('truncateText', () => {
      it('returns original text if within limit', () => {
        expect(truncateText('Hello', 10)).toBe('Hello');
      });

      it('truncates at word boundary', () => {
        const result = truncateText('Hello world, this is a test', 18);
        expect(result).toBe('Hello world,...');
      });

      it('uses custom ellipsis', () => {
        const result = truncateText('Hello world, this is a test', 18, 'en-US', '…');
        expect(result).toBe('Hello world,…');
      });

      it('handles single long word', () => {
        const result = truncateText('Supercalifragilisticexpialidocious', 10);
        expect(result.length).toBeLessThanOrEqual(13); // 10 + ellipsis
        expect(result.endsWith('...')).toBe(true);
      });
    });

    describe('formatList', () => {
      it('handles empty list', () => {
        expect(formatList([])).toBe('');
      });

      it('handles single item', () => {
        expect(formatList(['apple'])).toBe('apple');
      });

      it('handles two items', () => {
        expect(formatList(['apple', 'banana'])).toBe('apple and banana');
      });

      it('handles multiple items', () => {
        const result = formatList(['apple', 'banana', 'cherry']);
        expect(result).toBe('apple, banana, and cherry');
      });

      it('supports disjunction', () => {
        const result = formatList(['apple', 'banana', 'cherry'], 'en', 'disjunction');
        expect(result).toBe('apple, banana, or cherry');
      });
    });

    describe('capitalize', () => {
      it('capitalizes first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
      });

      it('handles empty string', () => {
        expect(capitalize('')).toBe('');
      });

      it('handles already capitalized', () => {
        expect(capitalize('Hello')).toBe('Hello');
      });
    });

    describe('toKebabCase', () => {
      it('converts camelCase to kebab-case', () => {
        expect(toKebabCase('helloWorld')).toBe('hello-world');
      });

      it('converts PascalCase to kebab-case', () => {
        expect(toKebabCase('HelloWorld')).toBe('hello-world');
      });

      it('converts spaces to hyphens', () => {
        expect(toKebabCase('hello world')).toBe('hello-world');
      });

      it('converts underscores to hyphens', () => {
        expect(toKebabCase('hello_world')).toBe('hello-world');
      });
    });

    describe('toCamelCase', () => {
      it('converts kebab-case to camelCase', () => {
        expect(toCamelCase('hello-world')).toBe('helloWorld');
      });

      it('converts snake_case to camelCase', () => {
        expect(toCamelCase('hello_world')).toBe('helloWorld');
      });

      it('converts spaces to camelCase', () => {
        expect(toCamelCase('hello world')).toBe('helloWorld');
      });

      it('handles already camelCase', () => {
        expect(toCamelCase('helloWorld')).toBe('helloWorld');
      });
    });
  });

  describe('Object utilities', () => {
    describe('pick', () => {
      it('picks specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
      });

      it('ignores non-existent keys', () => {
        const obj = { a: 1 } as { a: number; b?: number };
        expect(pick(obj, ['a', 'b'])).toEqual({ a: 1 });
      });
    });

    describe('omit', () => {
      it('omits specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
      });

      it('handles non-existent keys', () => {
        const obj = { a: 1 } as { a: number; b?: number };
        expect(omit(obj, ['b'])).toEqual({ a: 1 });
      });
    });

    describe('fromEntries', () => {
      it('creates object from entries', () => {
        const entries = [
          ['a', 1],
          ['b', 2],
        ] as const;
        expect(fromEntries(entries)).toEqual({ a: 1, b: 2 });
      });
    });
  });

  describe('Function utilities', () => {
    describe('memoize', () => {
      it('caches function results', () => {
        const fn = vi.fn((n: number) => n * 2);
        const memoized = memoize(fn);

        expect(memoized(5)).toBe(10);
        expect(memoized(5)).toBe(10);
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('caches per argument', () => {
        const fn = vi.fn((n: number) => n * 2);
        const memoized = memoize(fn);

        expect(memoized(5)).toBe(10);
        expect(memoized(10)).toBe(20);
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });

    describe('debounce', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('delays function execution', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('resets timer on subsequent calls', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(50);
        debounced();
        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe('throttle', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('executes immediately on first call', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('ignores calls within throttle period', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('allows call after throttle period', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        vi.advanceTimersByTime(100);
        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });

    describe('once', () => {
      it('executes function only once', () => {
        const fn = vi.fn(() => 'result');
        const onceFn = once(fn);

        expect(onceFn()).toBe('result');
        expect(onceFn()).toBe('result');
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('returns same result on subsequent calls', () => {
        let counter = 0;
        const fn = once(() => ++counter);

        expect(fn()).toBe(1);
        expect(fn()).toBe(1);
        expect(fn()).toBe(1);
      });
    });
  });
});
