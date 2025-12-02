import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Folder, Page, SearchResult } from '@/types';
import { useSidebarKeyboardNavigation } from '../useSidebarKeyboardNavigation';

type SidebarEntry = Folder | Page;

const createFolder = (overrides?: Partial<Folder>): Folder => ({
  id: 'folder-1',
  name: 'Folder One',
  type: 'folder',
  children: [],
  items: [],
  ...overrides,
});

const createPage = (overrides?: Partial<Page>): Page => ({
  id: 'page-1',
  name: 'Page One',
  type: 'txt',
  content: 'Body',
  ...overrides,
});

const createFolderResult = (): SearchResult => {
  const folder = createFolder();
  return {
    type: 'folder',
    id: folder.id,
    label: folder.name,
    path: ['folder-1'],
    folder,
  };
};

const createPageResult = (): SearchResult => {
  const page = createPage();
  return {
    type: 'page',
    id: page.id,
    label: page.name,
    page,
  };
};

describe('useSidebarKeyboardNavigation', () => {
  let sidebarElement: HTMLDivElement;

  beforeEach(() => {
    sidebarElement = document.createElement('div');
    document.body.appendChild(sidebarElement);
  });

  afterEach(() => {
    document.body.removeChild(sidebarElement);
    vi.restoreAllMocks();
  });

  const setup = ({
    isSidebarOpen = true,
    sidebarQuery = '',
    sidebarResults = [] as SearchResult[],
    allVisibleItems = [] as SidebarEntry[],
  } = {}) => {
    const handleSearchResultSelect = vi.fn();
    const handleNavigate = vi.fn();
    const setFocusedIndex = vi.fn();

    const hookResult = renderHook(() => {
      useSidebarKeyboardNavigation({
        isSidebarOpen,
        sidebarQuery,
        sidebarResults,
        allVisibleItems,
        focusedIndex: 0,
        setFocusedIndex,
        handleSearchResultSelect,
        handleNavigate,
        sidebarElement,
      });

      return {
        setFocusedIndex,
        handleSearchResultSelect,
        handleNavigate,
      };
    });

    return hookResult;
  };

  it('ignores keyboard events when sidebar is closed', () => {
    const { result } = setup({
      isSidebarOpen: false,
      allVisibleItems: [createFolder()],
    });
    const { handleNavigate } = result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    expect(handleNavigate).not.toHaveBeenCalled();
  });

  it('moves focus through visible items in normal mode with ArrowUp/ArrowDown', () => {
    const items: SidebarEntry[] = [createFolder(), createPage()];
    const hookResult = setup({
      allVisibleItems: items,
    });
    const { setFocusedIndex } = hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(setFocusedIndex).toHaveBeenCalledTimes(2);
  });

  it('invokes handleNavigate on Enter in normal mode', () => {
    const items: SidebarEntry[] = [createFolder(), createPage()];
    const hookResult = setup({
      allVisibleItems: items,
    });
    const { handleNavigate } = hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(handleNavigate).toHaveBeenCalledTimes(1);
    // 具體選擇哪一個項目由 Sidebar 元件的整合測試覆蓋
  });

  it('navigates search results in search mode and invokes handleSearchResultSelect', () => {
    const folderResult = createFolderResult();
    const pageResult = createPageResult();
    const results = [folderResult, pageResult];

    const hookResult = setup({
      sidebarQuery: 'doc',
      sidebarResults: results,
      allVisibleItems: [],
    });
    const { handleSearchResultSelect } = hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(handleSearchResultSelect).toHaveBeenCalledTimes(1);
    // 具體 index 行為由上層搜尋元件測試覆蓋
  });
});
