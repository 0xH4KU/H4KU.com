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

    // Verify the ArrowDown updater increments when not at end
    const downCall = setFocusedIndex.mock.calls[0];
    if (!downCall) {
      throw new Error('Expected ArrowDown to call setFocusedIndex');
    }
    const downUpdater = downCall[0] as (prev: number) => number;
    expect(downUpdater(0)).toBe(1);
    // At the end, stays at same index
    expect(downUpdater(items.length - 1)).toBe(items.length - 1);

    // Verify the ArrowUp updater decrements when not at start
    const upCall = setFocusedIndex.mock.calls[1];
    if (!upCall) {
      throw new Error('Expected ArrowUp to call setFocusedIndex');
    }
    const upUpdater = upCall[0] as (prev: number) => number;
    expect(upUpdater(1)).toBe(0);
    // At start, stays at 0
    expect(upUpdater(0)).toBe(0);
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
    const { handleSearchResultSelect, setFocusedIndex } =
      hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(handleSearchResultSelect).toHaveBeenCalledTimes(1);

    // Verify ArrowDown updater in search mode
    const downCall = setFocusedIndex.mock.calls[0];
    if (!downCall) {
      throw new Error('Expected ArrowDown to call setFocusedIndex');
    }
    const downUpdater = downCall[0] as (prev: number) => number;
    expect(downUpdater(0)).toBe(1);
    expect(downUpdater(results.length - 1)).toBe(results.length - 1);

    // Verify ArrowUp updater in search mode
    const upCall = setFocusedIndex.mock.calls[1];
    if (!upCall) {
      throw new Error('Expected ArrowUp to call setFocusedIndex');
    }
    const upUpdater = upCall[0] as (prev: number) => number;
    expect(upUpdater(1)).toBe(0);
    expect(upUpdater(0)).toBe(0);
  });

  it('resets focus on Escape in search mode', () => {
    const hookResult = setup({
      sidebarQuery: 'doc',
      sidebarResults: [createPageResult()],
    });
    const { setFocusedIndex } = hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(setFocusedIndex).toHaveBeenCalledWith(expect.any(Function));
  });

  it('ignores key events originating inside the sidebar element', () => {
    const items: SidebarEntry[] = [createFolder()];
    const hookResult = setup({
      allVisibleItems: items,
    });
    const innerButton = document.createElement('button');
    sidebarElement.appendChild(innerButton);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'target', { value: innerButton });
      window.dispatchEvent(event);
    });

    expect(hookResult.result.current.handleNavigate).not.toHaveBeenCalled();
  });

  it('resets focus on Escape in normal mode', () => {
    const hookResult = setup({
      allVisibleItems: [createFolder()],
    });
    const { setFocusedIndex } = hookResult.result.current;

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(setFocusedIndex).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not invoke handleSearchResultSelect when focusedIndex is negative in search mode', () => {
    const results = [createFolderResult()];
    const hookResult = renderHook(() => {
      const handleSearchResultSelect = vi.fn();
      const setFocusedIndex = vi.fn();

      useSidebarKeyboardNavigation({
        isSidebarOpen: true,
        sidebarQuery: 'doc',
        sidebarResults: results,
        allVisibleItems: [],
        focusedIndex: -1,
        setFocusedIndex,
        handleSearchResultSelect,
        handleNavigate: vi.fn(),
        sidebarElement,
      });

      return { handleSearchResultSelect };
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(
      hookResult.result.current.handleSearchResultSelect
    ).not.toHaveBeenCalled();
  });

  it('does not invoke handleNavigate when focusedIndex is negative in normal mode', () => {
    const items: SidebarEntry[] = [createFolder()];
    const hookResult = renderHook(() => {
      const handleNavigate = vi.fn();
      const setFocusedIndex = vi.fn();

      useSidebarKeyboardNavigation({
        isSidebarOpen: true,
        sidebarQuery: '',
        sidebarResults: [],
        allVisibleItems: items,
        focusedIndex: -1,
        setFocusedIndex,
        handleSearchResultSelect: vi.fn(),
        handleNavigate,
        sidebarElement,
      });

      return { handleNavigate };
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(hookResult.result.current.handleNavigate).not.toHaveBeenCalled();
  });

  it('does not invoke handleSearchResultSelect when result is undefined in search mode', () => {
    const results = [createFolderResult()];
    const hookResult = renderHook(() => {
      const handleSearchResultSelect = vi.fn();
      const setFocusedIndex = vi.fn();

      useSidebarKeyboardNavigation({
        isSidebarOpen: true,
        sidebarQuery: 'doc',
        sidebarResults: results,
        allVisibleItems: [],
        focusedIndex: 99, // out of bounds
        setFocusedIndex,
        handleSearchResultSelect,
        handleNavigate: vi.fn(),
        sidebarElement,
      });

      return { handleSearchResultSelect };
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(
      hookResult.result.current.handleSearchResultSelect
    ).not.toHaveBeenCalled();
  });

  it('does not invoke handleNavigate when item is undefined in normal mode', () => {
    const items: SidebarEntry[] = [createFolder()];
    const hookResult = renderHook(() => {
      const handleNavigate = vi.fn();
      const setFocusedIndex = vi.fn();

      useSidebarKeyboardNavigation({
        isSidebarOpen: true,
        sidebarQuery: '',
        sidebarResults: [],
        allVisibleItems: items,
        focusedIndex: 99, // out of bounds
        setFocusedIndex,
        handleSearchResultSelect: vi.fn(),
        handleNavigate,
        sidebarElement,
      });

      return { handleNavigate };
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(hookResult.result.current.handleNavigate).not.toHaveBeenCalled();
  });
});
