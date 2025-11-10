import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { FC, ReactNode } from 'react';
import {
  NavigationProvider,
  useNavigation,
} from '@/contexts/NavigationContext';
import { mockData } from '@/data/mockData';
import type { Folder, ImageWorkItem, Page, WorkItem } from '@/types';

const createWorkItem = (
  id: string,
  overrides: Partial<ImageWorkItem> = {}
): ImageWorkItem =>
  ({
    itemType: 'work',
    id,
    filename: `${id}.png`,
    thumb: `/${id}.png`,
    full: `/${id}.png`,
    ...overrides,
  }) satisfies ImageWorkItem;

const createPage = (id: string, overrides: Partial<Page> = {}) => ({
  id,
  name: id,
  type: 'txt' as const,
  content: `${id} content`,
  ...overrides,
});

const createFolder = (id: string, items: WorkItem[], children: Folder[] = []) =>
  ({
    id,
    name: id,
    type: 'folder' as const,
    parentId: null,
    items,
    children,
  }) satisfies Folder;

describe('NavigationProvider', () => {
  const originalData = {
    folders: mockData.folders,
    pages: mockData.pages,
    home: mockData.homeItems,
  };

  const createWrapper = (initialEntries: string[] = ['/']) => {
    const NavigationTestWrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>
        <NavigationProvider>{children}</NavigationProvider>
      </MemoryRouter>
    );
    NavigationTestWrapper.displayName = 'NavigationTestWrapper';
    return NavigationTestWrapper;
  };

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    mockData.folders = originalData.folders;
    mockData.pages = originalData.pages;
    mockData.homeItems = originalData.home;
  });

  it('navigates nested folders and derives breadcrumb labels', () => {
    const innerFolder = createFolder('inner', []);
    const outerFolder = createFolder('outer', [], [innerFolder]);
    mockData.folders = [outerFolder];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(innerFolder, ['outer', 'inner']);
    });

    expect(result.current.currentPath).toEqual(['home', 'outer', 'inner']);
    expect(result.current.breadcrumbSegments.map(seg => seg.label)).toEqual([
      'home',
      'outer',
      'inner',
    ]);
  });

  it('handles lightbox navigation loops', () => {
    const works = [createWorkItem('img-1'), createWorkItem('img-2')];
    mockData.folders = [
      {
        ...createFolder('gallery', works),
        items: works,
      },
    ];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(works[0], works);
    });
    expect(result.current.lightboxIndex).toBe(0);

    act(() => {
      result.current.navigateToNextImage();
    });
    expect(result.current.lightboxIndex).toBe(1);

    act(() => {
      result.current.navigateToNextImage();
    });
    expect(result.current.lightboxIndex).toBe(0);

    act(() => {
      result.current.navigateToPrevImage();
    });
    expect(result.current.lightboxIndex).toBe(1);
  });

  it('falls back to home when trying to navigate unknown breadcrumbs', () => {
    mockData.folders = [];
    mockData.pages = [createPage('about')];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(createPage('missing'), ['home', 'unknown']);
    });
    expect(result.current.currentPath).toEqual(['home', 'unknown', 'missing']);

    act(() => {
      result.current.navigateBack();
    });
    expect(result.current.currentPath).toEqual(['home']);
  });

  it('initializes from nested folder URLs', async () => {
    const innerFolder = createFolder('inner', []);
    const outerFolder = createFolder('outer', [], [innerFolder]);
    mockData.folders = [outerFolder];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(['/folder/outer/inner']),
    });

    await waitFor(() =>
      expect(result.current.currentPath).toEqual(['home', 'outer', 'inner'])
    );
    expect(result.current.currentView?.type).toBe('folder');
    expect(result.current.currentView?.data.id).toBe('inner');
  });

  it('initializes from page URLs', async () => {
    const page = createPage('about', { content: 'hi' });
    mockData.folders = [];
    mockData.pages = [page];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(['/page/about']),
    });

    await waitFor(() =>
      expect(result.current.currentPath).toEqual(['home', 'about'])
    );
    expect(result.current.currentView?.type).toBe('txt');
    expect(result.current.currentView?.data.id).toBe('about');
  });

  it('navigates back through nested folders', () => {
    const innerFolder = createFolder('inner', []);
    const outerFolder = createFolder('outer', [createWorkItem('cover')], [
      innerFolder,
    ]);
    mockData.folders = [outerFolder];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(outerFolder);
    });
    act(() => {
      result.current.navigateTo(innerFolder);
    });

    expect(result.current.currentPath).toEqual(['home', 'outer', 'inner']);

    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentPath).toEqual(['home', 'outer']);
    expect(result.current.currentView?.type).toBe('folder');
    expect(result.current.currentView?.data.id).toBe('outer');
  });

  it('navigates back from pages to their parent folder', () => {
    const innerFolder = createFolder('inner', []);
    mockData.folders = [innerFolder];
    const page = createPage('notes', { name: 'Notes' });
    mockData.pages = [page];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(page, ['inner']);
    });
    expect(result.current.currentPath).toEqual(['home', 'inner', 'notes']);

    act(() => {
      result.current.navigateBack();
    });

    expect(result.current.currentPath).toEqual(['home', 'inner']);
    expect(result.current.currentView?.type).toBe('folder');
    expect(result.current.currentView?.data.id).toBe('inner');
  });

  it('handles breadcrumb selections for home and intermediate folders', () => {
    const innerFolder = createFolder('inner', []);
    const outerFolder = createFolder('outer', [], [innerFolder]);
    mockData.folders = [outerFolder];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(innerFolder, ['outer', 'inner']);
    });

    act(() => {
      result.current.handleBreadcrumbSelect('home', 0);
    });
    expect(result.current.currentPath).toEqual(['home']);

    act(() => {
      result.current.navigateTo(innerFolder);
    });
    act(() => {
      result.current.handleBreadcrumbSelect('outer', 1);
    });

    expect(result.current.currentPath).toEqual(['home', 'outer']);
  });

  it('handles breadcrumb selections targeting pages', () => {
    const folder = createFolder('docs', []);
    mockData.folders = [folder];
    const page = createPage('faq', { name: 'FAQ' });
    mockData.pages = [page];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(page, ['docs']);
    });

    act(() => {
      result.current.handleBreadcrumbSelect('faq', 2);
    });

    expect(result.current.currentPath).toEqual(['home', 'docs', 'faq']);
    expect(result.current.currentView?.type).toBe('txt');
  });

  it('ignores folder navigation when no matching path can be derived', () => {
    mockData.folders = [];
    mockData.pages = [];
    mockData.homeItems = [];
    const orphanFolder = createFolder('orphan', []);

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.navigateTo(orphanFolder);
    });

    expect(result.current.currentPath).toEqual(['home']);
    expect(result.current.currentView).toBeNull();
  });

  it('closes lightbox state and ignores navigation without gallery', () => {
    const works = [createWorkItem('img-1'), createWorkItem('img-2')];
    mockData.folders = [];
    mockData.pages = [];
    mockData.homeItems = [];

    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(works[0], works);
    });
    expect(result.current.lightboxGallery).toHaveLength(2);

    act(() => {
      result.current.closeLightbox();
    });
    expect(result.current.lightboxGallery).toHaveLength(0);
    expect(result.current.lightboxImage).toBeNull();

    act(() => {
      result.current.navigateToNextImage();
      result.current.navigateToPrevImage();
    });

    expect(result.current.lightboxIndex).toBe(0);
  });
});

describe('useNavigation', () => {
  it('throws outside provider', () => {
    expect(() => renderHook(() => useNavigation())).toThrow(
      /must be used within NavigationProvider/i
    );
  });
});
