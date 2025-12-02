import { describe, it, expect } from 'vitest';
import {
  getImageGallery,
  isImageWorkItem,
  isPageItem,
  isFolder,
  filterWorkImages,
  filterPages,
} from '../workItems';
import type { ImageWorkItem, WorkItem } from '@/types';

const createImageItem = (overrides: Partial<ImageWorkItem> = {}) =>
  ({
    id: 'image-1',
    filename: 'image-1.png',
    itemType: 'work',
    thumb: '/thumb.png',
    full: '/full.png',
    ...overrides,
  }) satisfies ImageWorkItem;

const createTextItem = (): WorkItem => ({
  id: 'text-1',
  filename: 'notes.txt',
  itemType: 'page',
  content: 'Example content',
});

describe('isImageWorkItem', () => {
  it('narrows to ImageWorkItem when the type is work', () => {
    const item = createImageItem();
    expect(isImageWorkItem(item)).toBe(true);
  });

  it('returns false for non-image work items', () => {
    const item = createTextItem();
    expect(isImageWorkItem(item)).toBe(false);
  });
});

describe('getImageGallery', () => {
  it('returns an empty array when the folder is missing or empty', () => {
    expect(getImageGallery(null)).toEqual([]);
    expect(getImageGallery({ items: [] })).toEqual([]);
  });

  it('filters out non-image items from the folder', () => {
    const imageA = createImageItem({ id: 'image-a' });
    const imageB = createImageItem({ id: 'image-b', filename: 'b.png' });
    const text = createTextItem();

    const result = getImageGallery({
      items: [imageA, text, imageB],
    });

    expect(result).toEqual([imageA, imageB]);
  });
});

describe('isPageItem', () => {
  it('returns true for text/page items', () => {
    const item = createTextItem();
    expect(isPageItem(item)).toBe(true);
  });

  it('returns false for image work items', () => {
    const item = createImageItem();
    expect(isPageItem(item as WorkItem)).toBe(false);
  });
});

describe('isFolder', () => {
  it('returns true for Folder-shaped objects', () => {
    const folder = {
      id: 'folder-1',
      name: 'Folder',
      type: 'folder' as const,
    };
    expect(isFolder(folder)).toBe(true);
  });

  it('returns false for non-folder values', () => {
    expect(isFolder(null)).toBe(false);
    expect(isFolder({})).toBe(false);
    expect(isFolder({ type: 'txt' })).toBe(false);
  });
});

describe('filter helpers', () => {
  it('filterWorkImages returns only non-page work items', () => {
    const image = createImageItem();
    const text = createTextItem();

    const result = filterWorkImages([image, text]);
    expect(result).toEqual([image]);
  });

  it('filterPages returns only page items', () => {
    const image = createImageItem();
    const text = createTextItem();

    const result = filterPages([image, text]);
    expect(result).toEqual([text]);
  });
});
