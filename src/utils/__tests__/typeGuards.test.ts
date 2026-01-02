import { describe, it, expect } from 'vitest';
import {
  isImageWorkItem,
  isTextWorkItem,
  isFolder,
  isPage,
  isFolderSearchResult,
  isPageSearchResult,
  isWorkSearchResult,
  isFolderView,
  isPageView,
  isDefined,
  isNonEmptyString,
  isNonEmptyArray,
  isValidDateString,
  isPlainObject,
  assertDefined,
  assert,
  assertNever,
} from '../typeGuards';
import type {
  Folder,
  Page,
  ImageWorkItem,
  TextWorkItem,
  SearchResult,
  ViewType,
} from '@/types';

describe('typeGuards', () => {
  describe('WorkItem guards', () => {
    const imageWork: ImageWorkItem = {
      id: '1',
      filename: 'test.jpg',
      itemType: 'work',
      thumb: '/thumb.jpg',
      full: '/full.jpg',
    };

    const textWork: TextWorkItem = {
      id: '2',
      filename: 'test.txt',
      itemType: 'page',
      content: 'Hello',
    };

    it('isImageWorkItem returns true for image work items', () => {
      expect(isImageWorkItem(imageWork)).toBe(true);
      expect(isImageWorkItem(textWork)).toBe(false);
    });

    it('isTextWorkItem returns true for text work items', () => {
      expect(isTextWorkItem(textWork)).toBe(true);
      expect(isTextWorkItem(imageWork)).toBe(false);
    });
  });

  describe('Navigation item guards', () => {
    const folder: Folder = {
      id: 'folder1',
      name: 'Test Folder',
      type: 'folder',
    };

    const page: Page = {
      id: 'page1',
      name: 'Test Page',
      type: 'txt',
      content: 'Content',
    };

    it('isFolder returns true for folders', () => {
      expect(isFolder(folder)).toBe(true);
      expect(isFolder(page)).toBe(false);
    });

    it('isPage returns true for pages', () => {
      expect(isPage(page)).toBe(true);
      expect(isPage(folder)).toBe(false);
    });
  });

  describe('SearchResult guards', () => {
    const folder: Folder = {
      id: 'folder1',
      name: 'Test',
      type: 'folder',
    };

    const page: Page = {
      id: 'page1',
      name: 'Test',
      type: 'txt',
      content: '',
    };

    const folderResult: SearchResult = {
      type: 'folder',
      id: 'folder1',
      label: 'Test Folder',
      path: ['folder1'],
      folder,
    };

    const pageResult: SearchResult = {
      type: 'page',
      id: 'page1',
      label: 'Test Page',
      page,
    };

    const workResult: SearchResult = {
      type: 'work',
      id: 'work1',
      label: 'Test Work',
      path: ['folder1'],
      folder,
      work: {
        id: 'work1',
        filename: 'test.jpg',
        itemType: 'work',
        thumb: '/thumb.jpg',
        full: '/full.jpg',
      },
    };

    it('isFolderSearchResult returns true for folder results', () => {
      expect(isFolderSearchResult(folderResult)).toBe(true);
      expect(isFolderSearchResult(pageResult)).toBe(false);
      expect(isFolderSearchResult(workResult)).toBe(false);
    });

    it('isPageSearchResult returns true for page results', () => {
      expect(isPageSearchResult(pageResult)).toBe(true);
      expect(isPageSearchResult(folderResult)).toBe(false);
      expect(isPageSearchResult(workResult)).toBe(false);
    });

    it('isWorkSearchResult returns true for work results', () => {
      expect(isWorkSearchResult(workResult)).toBe(true);
      expect(isWorkSearchResult(folderResult)).toBe(false);
      expect(isWorkSearchResult(pageResult)).toBe(false);
    });
  });

  describe('ViewType guards', () => {
    const folder: Folder = {
      id: 'folder1',
      name: 'Test',
      type: 'folder',
    };

    const page: Page = {
      id: 'page1',
      name: 'Test',
      type: 'txt',
      content: '',
    };

    const folderView: ViewType = { type: 'folder', data: folder };
    const pageView: ViewType = { type: 'txt', data: page };

    it('isFolderView returns true for folder views', () => {
      expect(isFolderView(folderView)).toBe(true);
      expect(isFolderView(pageView)).toBe(false);
    });

    it('isPageView returns true for page views', () => {
      expect(isPageView(pageView)).toBe(true);
      expect(isPageView(folderView)).toBe(false);
    });
  });

  describe('Generic guards', () => {
    describe('isDefined', () => {
      it('returns true for defined values', () => {
        expect(isDefined(0)).toBe(true);
        expect(isDefined('')).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined([])).toBe(true);
        expect(isDefined({})).toBe(true);
      });

      it('returns false for null and undefined', () => {
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('returns true for non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString(' ')).toBe(true);
      });

      it('returns false for empty strings and non-strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString([])).toBe(false);
      });
    });

    describe('isNonEmptyArray', () => {
      it('returns true for non-empty arrays', () => {
        expect(isNonEmptyArray([1])).toBe(true);
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(isNonEmptyArray([''])).toBe(true);
      });

      it('returns false for empty arrays and non-arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
        expect(isNonEmptyArray(null)).toBe(false);
        expect(isNonEmptyArray(undefined)).toBe(false);
      });
    });

    describe('isValidDateString', () => {
      it('returns true for valid date strings', () => {
        expect(isValidDateString('2024-01-01')).toBe(true);
        expect(isValidDateString('2024-12-31T23:59:59Z')).toBe(true);
        expect(isValidDateString('January 1, 2024')).toBe(true);
      });

      it('returns false for invalid date strings', () => {
        expect(isValidDateString('not a date')).toBe(false);
        expect(isValidDateString('')).toBe(false);
        expect(isValidDateString(null)).toBe(false);
        expect(isValidDateString(123)).toBe(false);
      });
    });

    describe('isPlainObject', () => {
      it('returns true for plain objects', () => {
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({ key: 'value' })).toBe(true);
      });

      it('returns false for non-plain objects', () => {
        expect(isPlainObject(null)).toBe(false);
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject('string')).toBe(false);
        expect(isPlainObject(123)).toBe(false);
        expect(isPlainObject(undefined)).toBe(false);
      });
    });
  });

  describe('Assertion functions', () => {
    describe('assertDefined', () => {
      it('does not throw for defined values', () => {
        expect(() => assertDefined(0)).not.toThrow();
        expect(() => assertDefined('')).not.toThrow();
        expect(() => assertDefined(false)).not.toThrow();
      });

      it('throws for null and undefined', () => {
        expect(() => assertDefined(null)).toThrow(
          'Expected value to be defined'
        );
        expect(() => assertDefined(undefined)).toThrow(
          'Expected value to be defined'
        );
      });

      it('throws with custom message', () => {
        expect(() => assertDefined(null, 'Custom message')).toThrow(
          'Custom message'
        );
      });
    });

    describe('assert', () => {
      it('does not throw for true conditions', () => {
        expect(() => assert(true)).not.toThrow();
        expect(() => assert(1 === 1)).not.toThrow();
      });

      it('throws for false conditions', () => {
        expect(() => assert(false)).toThrow('Assertion failed');
        expect(() => assert(false, 'Custom message')).toThrow('Custom message');
      });
    });

    describe('assertNever', () => {
      it('always throws', () => {
        // We need to cast to never to test this
        expect(() => assertNever('unexpected' as never)).toThrow(
          'Unexpected value: unexpected'
        );
        expect(() => assertNever('value' as never, 'Custom message')).toThrow(
          'Custom message'
        );
      });
    });
  });
});
