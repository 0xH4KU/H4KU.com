import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Folder, Page, WorkItem } from '@/types';

vi.mock('@/utils/workItems', () => {
  return {
    getImageGallery: vi.fn(),
    isImageWorkItem: vi.fn((work: WorkItem) => work.itemType === 'work'),
  };
});

import { getImageGallery, isImageWorkItem } from '@/utils/workItems';
import { navigateFromSearchResult } from '@/utils/searchNavigation';

describe('navigateFromSearchResult', () => {
  const baseFolder: Folder = {
    id: 'character-designs',
    name: 'Character Designs',
    type: 'folder',
  };

  const page: Page = {
    id: 'about',
    name: 'About',
    type: 'txt',
    content: 'About text',
  };

  const textWork: WorkItem = {
    itemType: 'page',
    id: 'bio',
    filename: 'bio.txt',
    content: 'Bio content',
  };

  const contentlessWork = {
    itemType: 'page',
    id: 'empty',
    filename: 'empty.txt',
  } as unknown as WorkItem;

  const imageWork: WorkItem = {
    itemType: 'work',
    id: 'lumina',
    filename: 'Lumina',
    thumb: '/thumb',
    full: '/full',
  };

  const navigateTo = vi.fn();
  const openLightbox = vi.fn();
  const mockedGallery = vi.mocked(getImageGallery);
  const mockedIsImageWorkItem = vi.mocked(isImageWorkItem);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGallery.mockReturnValue([]);
    mockedIsImageWorkItem.mockImplementation(work => work.itemType === 'work');
  });

  it('navigates folders when the result type is folder', () => {
    const handled = navigateFromSearchResult(
      {
        type: 'folder',
        id: 'folder',
        label: 'Character Designs',
        path: ['home', 'character-designs'],
        folder: baseFolder,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith(baseFolder, [
      'home',
      'character-designs',
    ]);
  });

  it('opens standalone pages directly', () => {
    const handled = navigateFromSearchResult(
      {
        type: 'page',
        id: 'about',
        label: 'About',
        page,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith(page);
  });

  it('converts text work items into page descriptors', () => {
    const handled = navigateFromSearchResult(
      {
        type: 'work',
        id: 'bio',
        label: 'Artist Bio',
        path: ['home', 'character-designs'],
        folder: baseFolder,
        work: textWork,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bio', content: 'Bio content' }),
      ['home', 'character-designs']
    );
  });

  it('falls back to empty content when page work lacks body text', () => {
    const handled = navigateFromSearchResult(
      {
        type: 'work',
        id: 'empty',
        label: 'Empty',
        path: ['home'],
        folder: baseFolder,
        work: contentlessWork,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(true);
    expect(navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'empty', content: '' }),
      ['home']
    );
  });

  it('opens the lightbox for image work items with a gallery', () => {
    mockedGallery.mockReturnValue([imageWork]);
    mockedIsImageWorkItem.mockReturnValue(true);

    const handled = navigateFromSearchResult(
      {
        type: 'work',
        id: 'lumina',
        label: 'Lumina',
        path: ['home', 'character-designs'],
        folder: baseFolder,
        work: imageWork,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(true);
    expect(openLightbox).toHaveBeenCalledWith(imageWork, [imageWork]);
  });

  it('returns false when there is nothing to handle', () => {
    mockedIsImageWorkItem.mockReturnValue(false);

    const handled = navigateFromSearchResult(
      {
        type: 'work',
        id: 'lumina',
        label: 'Lumina',
        path: ['home', 'character-designs'],
        folder: baseFolder,
        work: imageWork,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(false);
    expect(openLightbox).not.toHaveBeenCalled();
  });

  it('returns false for image work when the gallery is empty', () => {
    mockedGallery.mockReturnValue([]);
    mockedIsImageWorkItem.mockReturnValue(true);

    const handled = navigateFromSearchResult(
      {
        type: 'work',
        id: 'lumina',
        label: 'Lumina',
        path: ['home'],
        folder: baseFolder,
        work: imageWork,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(false);
    expect(openLightbox).not.toHaveBeenCalled();
  });

  it('returns false for unknown result types', () => {
    const handled = navigateFromSearchResult(
      {
        // @ts-expect-error simulate unsupported type
        type: 'unknown',
        id: 'mystery',
        label: 'Mystery',
        folder: baseFolder,
      },
      { navigateTo, openLightbox }
    );

    expect(handled).toBe(false);
    expect(navigateTo).not.toHaveBeenCalled();
    expect(openLightbox).not.toHaveBeenCalled();
  });
});
