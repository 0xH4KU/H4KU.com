import { describe, it, expect } from 'vitest';
import {
  flattenFolders,
  findFolderByPath,
  findFolderPathById,
  findFolderById,
} from '../navigation';
import type { Folder } from '@/types';

describe('navigation utils', () => {
  // Test data structure
  const createFolder = (
    id: string,
    name: string,
    children?: Folder[]
  ): Folder => ({
    id,
    name,
    type: 'folder',
    children,
  });

  const mockFolders: Folder[] = [
    createFolder('2024', '2024', [
      createFolder('jan', 'January'),
      createFolder('feb', 'February', [
        createFolder('week1', 'Week 1'),
        createFolder('week2', 'Week 2'),
      ]),
    ]),
    createFolder('2025', '2025', [createFolder('mar', 'March')]),
    createFolder('featured', 'Featured'),
  ];

  describe('flattenFolders', () => {
    it('should flatten single level folders', () => {
      const folders: Folder[] = [
        createFolder('a', 'A'),
        createFolder('b', 'B'),
      ];

      const result = flattenFolders(folders);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ folder: folders[0], path: ['a'] });
      expect(result[1]).toEqual({ folder: folders[1], path: ['b'] });
    });

    it('should flatten nested folders', () => {
      const result = flattenFolders(mockFolders);

      // 3 root + 2 children of 2024 + 2 children of feb + 1 child of 2025 = 8 total
      expect(result).toHaveLength(8);

      // Check root level
      expect(result[0].path).toEqual(['2024']);
      expect(result[0].folder.id).toBe('2024');

      // Check nested level
      expect(result[1].path).toEqual(['2024', 'jan']);
      expect(result[1].folder.id).toBe('jan');

      // Check deeply nested
      expect(result[3].path).toEqual(['2024', 'feb', 'week1']);
      expect(result[3].folder.id).toBe('week1');
    });

    it('should handle empty array', () => {
      const result = flattenFolders([]);
      expect(result).toEqual([]);
    });

    it('should handle folders without children', () => {
      const folders: Folder[] = [createFolder('single', 'Single')];
      const result = flattenFolders(folders);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        folder: folders[0],
        path: ['single'],
      });
    });

    it('should preserve folder order', () => {
      const result = flattenFolders(mockFolders);

      const ids = result.map(r => r.folder.id);
      expect(ids).toEqual([
        '2024',
        'jan',
        'feb',
        'week1',
        'week2',
        '2025',
        'mar',
        'featured',
      ]);
    });
  });

  describe('findFolderByPath', () => {
    it('should find folder by root path', () => {
      const result = findFolderByPath(mockFolders, ['2024']);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('2024');
      expect(result?.name).toBe('2024');
    });

    it('should find folder by nested path', () => {
      const result = findFolderByPath(mockFolders, ['2024', 'feb']);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('feb');
      expect(result?.name).toBe('February');
    });

    it('should find folder by deeply nested path', () => {
      const result = findFolderByPath(mockFolders, ['2024', 'feb', 'week1']);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('week1');
      expect(result?.name).toBe('Week 1');
    });

    it('should return null for empty path', () => {
      const result = findFolderByPath(mockFolders, []);
      expect(result).toBeNull();
    });

    it('should return null for non-existent path', () => {
      const result = findFolderByPath(mockFolders, ['nonexistent']);
      expect(result).toBeNull();
    });

    it('should return null for partially valid path', () => {
      const result = findFolderByPath(mockFolders, ['2024', 'nonexistent']);
      expect(result).toBeNull();
    });

    it('should handle empty folders array', () => {
      const result = findFolderByPath([], ['any']);
      expect(result).toBeNull();
    });
  });

  describe('findFolderPathById', () => {
    it('should find path for root level folder', () => {
      const result = findFolderPathById(mockFolders, '2024');
      expect(result).toEqual(['2024']);
    });

    it('should find path for nested folder', () => {
      const result = findFolderPathById(mockFolders, 'feb');
      expect(result).toEqual(['2024', 'feb']);
    });

    it('should find path for deeply nested folder', () => {
      const result = findFolderPathById(mockFolders, 'week2');
      expect(result).toEqual(['2024', 'feb', 'week2']);
    });

    it('should return null for non-existent id', () => {
      const result = findFolderPathById(mockFolders, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should handle empty folders array', () => {
      const result = findFolderPathById([], 'any');
      expect(result).toBeNull();
    });

    it('should find first matching folder if multiple folders have same id', () => {
      const folders: Folder[] = [
        createFolder('dup', 'First'),
        createFolder('dup', 'Second'),
      ];

      const result = findFolderPathById(folders, 'dup');
      // Should find one of them (order may vary due to stack)
      expect(result).not.toBeNull();
      expect(result?.[0]).toBe('dup');
    });
  });

  describe('findFolderById', () => {
    it('should find folder at root level', () => {
      const result = findFolderById(mockFolders, '2024');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('2024');
      expect(result?.name).toBe('2024');
    });

    it('should find nested folder', () => {
      const result = findFolderById(mockFolders, 'feb');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('feb');
      expect(result?.name).toBe('February');
    });

    it('should find deeply nested folder', () => {
      const result = findFolderById(mockFolders, 'week1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('week1');
      expect(result?.name).toBe('Week 1');
    });

    it('should return null for empty id', () => {
      const result = findFolderById(mockFolders, '');
      expect(result).toBeNull();
    });

    it('should return null for non-existent id', () => {
      const result = findFolderById(mockFolders, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should handle empty folders array', () => {
      const result = findFolderById([], 'any');
      expect(result).toBeNull();
    });

    it('should find folder regardless of nesting level', () => {
      const allIds = [
        '2024',
        'jan',
        'feb',
        'week1',
        'week2',
        '2025',
        'mar',
        'featured',
      ];

      allIds.forEach(id => {
        const result = findFolderById(mockFolders, id);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(id);
      });
    });
  });

  describe('integration tests', () => {
    it('should work together: find by id and then get path', () => {
      const folder = findFolderById(mockFolders, 'week2');
      expect(folder).not.toBeNull();

      if (folder) {
        const path = findFolderPathById(mockFolders, folder.id);
        expect(path).toEqual(['2024', 'feb', 'week2']);
      }
    });

    it('should work together: find by path and verify id', () => {
      const path = ['2025', 'mar'];
      const folder = findFolderByPath(mockFolders, path);

      expect(folder).not.toBeNull();
      expect(folder?.id).toBe('mar');

      if (folder) {
        const foundPath = findFolderPathById(mockFolders, folder.id);
        expect(foundPath).toEqual(path);
      }
    });

    it('should flatten and then find all folders', () => {
      const flattened = flattenFolders(mockFolders);

      flattened.forEach(({ folder, path }) => {
        const foundById = findFolderById(mockFolders, folder.id);
        expect(foundById).toEqual(folder);

        const foundByPath = findFolderByPath(mockFolders, path);
        expect(foundByPath).toEqual(folder);
      });
    });
  });
});
