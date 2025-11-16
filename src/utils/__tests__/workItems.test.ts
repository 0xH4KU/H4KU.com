import { describe, it, expect } from 'vitest';
import { getImageGallery, isImageWorkItem } from '../workItems';
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
