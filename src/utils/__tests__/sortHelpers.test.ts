import { describe, it, expect } from 'vitest';
import {
  deriveSortableLabel,
  createLabelComparator,
  sortByLabel,
  getWorkItemLabel,
  getPageLabel,
  getFolderLabel,
} from '../sortHelpers';

describe('sortHelpers', () => {
  describe('deriveSortableLabel', () => {
    it('should return empty string for null or undefined', () => {
      expect(deriveSortableLabel(null)).toBe('');
      expect(deriveSortableLabel(undefined)).toBe('');
      expect(deriveSortableLabel('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(deriveSortableLabel('  hello  ')).toBe('hello');
      expect(deriveSortableLabel('\t test \n')).toBe('test');
    });

    it('should strip file extension when option is true', () => {
      expect(deriveSortableLabel('file.txt', { stripExtension: true })).toBe(
        'file'
      );
      expect(deriveSortableLabel('image.jpg', { stripExtension: true })).toBe(
        'image'
      );
      expect(deriveSortableLabel('doc.pdf', { stripExtension: true })).toBe(
        'doc'
      );
    });

    it('should not strip extension by default', () => {
      expect(deriveSortableLabel('file.txt')).toBe('file.txt');
      expect(deriveSortableLabel('image.jpg')).toBe('image.jpg');
    });

    it('should handle multiple dots in filename', () => {
      expect(
        deriveSortableLabel('file.name.txt', { stripExtension: true })
      ).toBe('file.name');
      expect(
        deriveSortableLabel('my.test.file.js', { stripExtension: true })
      ).toBe('my.test.file');
    });

    it('should handle files without extension', () => {
      expect(deriveSortableLabel('README', { stripExtension: true })).toBe(
        'README'
      );
      expect(deriveSortableLabel('noext', { stripExtension: true })).toBe(
        'noext'
      );
    });
  });

  describe('createLabelComparator', () => {
    it('should sort numeric values in ascending order (larger numbers later)', () => {
      const compare = createLabelComparator('asc');
      const items = ['10', '2', '1', '100'].sort(compare);

      // In asc mode, smaller numbers come first
      expect(items).toEqual(['1', '2', '10', '100']);
    });

    it('should sort numeric values in descending order (larger numbers first)', () => {
      const compare = createLabelComparator('desc');
      const items = ['10', '2', '1', '100'].sort(compare);

      // In desc mode, larger numbers come first
      expect(items).toEqual(['100', '10', '2', '1']);
    });

    it('should handle equal values', () => {
      const compare = createLabelComparator('asc');
      // Note: comparator returns -0 for equal values in asc mode (0 * -1 = -0)
      // Using Math.abs to handle -0 vs 0 comparison
      expect(Math.abs(compare('same', 'same'))).toBe(0);
      expect(Math.abs(compare('123', '123'))).toBe(0);
    });

    it('should sort items by actual output', () => {
      const items = [
        { label: '10-item' },
        { label: '2-item' },
        { label: '1-item' },
      ];

      const compare = createLabelComparator('asc');
      const sorted = items.sort((a, b) => compare(a.label, b.label));

      expect(sorted.map(i => i.label)).toEqual(['1-item', '2-item', '10-item']);
    });
  });

  describe('sortByLabel', () => {
    interface TestItem {
      id: string;
      label: string;
    }

    const items: TestItem[] = [
      { id: '1', label: '10-item' },
      { id: '2', label: '2-item' },
      { id: '3', label: 'zebra' },
      { id: '4', label: '1-item' },
      { id: '5', label: 'apple' },
    ];

    it('should sort items correctly', () => {
      const result = sortByLabel(items, 'asc', item => item.label);
      const labels = result.map(r => r.label);

      // In asc mode: text items first (reverse alphabetical), then numeric items (ascending)
      expect(labels).toEqual(['zebra', 'apple', '1-item', '2-item', '10-item']);
    });

    it('should not mutate original array', () => {
      const original = [...items];
      sortByLabel(items, 'asc', item => item.label);

      expect(items).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortByLabel([], 'asc', (item: TestItem) => item.label);
      expect(result).toEqual([]);
    });

    it('should handle undefined array', () => {
      const result = sortByLabel(
        undefined,
        'asc',
        (item: TestItem) => item.label
      );
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const single = [{ id: '1', label: 'only' }];
      const result = sortByLabel(single, 'asc', item => item.label);

      expect(result).toEqual(single);
    });
  });

  describe('getWorkItemLabel', () => {
    it('should prefer filename over title', () => {
      const work = {
        filename: '01-artwork.jpg',
        title: 'My Artwork',
        id: 'id1',
      };
      expect(getWorkItemLabel(work)).toBe('01-artwork');
    });

    it('should use title if filename is not available', () => {
      const work = { title: 'My Artwork', id: 'id1' };
      expect(getWorkItemLabel(work)).toBe('My Artwork');
    });

    it('should use id if neither filename nor title available', () => {
      const work = { id: 'fallback-id' };
      expect(getWorkItemLabel(work)).toBe('fallback-id');
    });

    it('should strip file extension from filename', () => {
      const work = { filename: 'image.png' };
      expect(getWorkItemLabel(work)).toBe('image');
    });

    it('should handle empty object', () => {
      expect(getWorkItemLabel({})).toBe('');
    });

    it('should handle whitespace', () => {
      const work = { filename: '  artwork.jpg  ' };
      expect(getWorkItemLabel(work)).toBe('artwork');
    });
  });

  describe('getPageLabel', () => {
    it('should prefer name over filename', () => {
      const page = { name: 'About', filename: 'about.md', id: 'id1' };
      expect(getPageLabel(page)).toBe('About');
    });

    it('should use filename if name is not available', () => {
      const page = { filename: 'contact.md', id: 'id1' };
      expect(getPageLabel(page)).toBe('contact.md');
    });

    it('should use id if neither name nor filename available', () => {
      const page = { id: 'fallback-id' };
      expect(getPageLabel(page)).toBe('fallback-id');
    });

    it('should not strip extension from filename', () => {
      const page = { filename: 'readme.txt' };
      expect(getPageLabel(page)).toBe('readme.txt');
    });

    it('should handle empty object', () => {
      expect(getPageLabel({})).toBe('');
    });

    it('should trim whitespace', () => {
      const page = { name: '  Contact  ' };
      expect(getPageLabel(page)).toBe('Contact');
    });
  });

  describe('getFolderLabel', () => {
    it('should prefer name over id', () => {
      const folder = { name: '2024', id: 'year-2024' };
      expect(getFolderLabel(folder)).toBe('2024');
    });

    it('should use id if name is not available', () => {
      const folder = { id: 'folder-id' };
      expect(getFolderLabel(folder)).toBe('folder-id');
    });

    it('should handle empty object', () => {
      expect(getFolderLabel({})).toBe('');
    });

    it('should trim whitespace', () => {
      const folder = { name: '  Featured  ' };
      expect(getFolderLabel(folder)).toBe('Featured');
    });
  });

  describe('integration: real-world sorting', () => {
    it('should sort year folders numerically in descending order', () => {
      const folders = [
        { name: '2023', id: 'year-2023' },
        { name: '2025', id: 'year-2025' },
        { name: '2024', id: 'year-2024' },
      ];

      const sorted = sortByLabel(folders, 'desc', getFolderLabel);

      expect(sorted.map(f => f.name)).toEqual(['2025', '2024', '2023']);
    });

    it('should handle mixed content correctly', () => {
      const items = ['10', '2', 'zebra', '1', 'apple', '100'];

      const compare = createLabelComparator('asc');
      const sorted = [...items].sort(compare);

      // In asc mode: text items first (reverse alphabetical), then numeric items (ascending)
      expect(sorted).toEqual(['zebra', 'apple', '1', '2', '10', '100']);

      // Verify the groups separately
      const textItems = sorted.filter(i => !/^\d+$/.test(i));
      const numericItems = sorted.filter(i => /^\d+$/.test(i));

      expect(textItems).toEqual(['zebra', 'apple']);
      expect(numericItems).toEqual(['1', '2', '10', '100']);
    });
  });
});
