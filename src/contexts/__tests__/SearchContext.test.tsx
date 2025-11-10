import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { mockData } from '@/data/mockData';
import type { Folder, Page, WorkItem } from '@/types';

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SearchProvider>{children}</SearchProvider>
);

const folderWork: WorkItem = {
  itemType: 'work',
  id: 'sketch-1',
  filename: 'Sketch Study',
  thumb: '/thumb.jpg',
  full: '/full.jpg',
};

const standalonePage: Page = {
  id: 'bio',
  name: 'Bio',
  type: 'txt',
  content: 'Artist bio page',
};

const homeNote: WorkItem = {
  itemType: 'page',
  id: 'note-1',
  filename: 'Home Note',
  content: 'home note content',
};

const rootFolder: Folder = {
  id: 'portfolio',
  name: 'Portfolio',
  type: 'folder',
  parentId: null,
  description: 'Case studies',
  items: [folderWork],
  children: [
    {
      id: 'subfolder',
      name: 'Archived',
      type: 'folder',
      parentId: 'portfolio',
      items: [],
      children: [],
    },
  ],
};

describe('SearchContext', () => {
  const originalFolders = mockData.folders;
  const originalPages = mockData.pages;
  const originalHomeItems = mockData.homeItems;

  beforeEach(() => {
    mockData.folders = [rootFolder];
    mockData.pages = [standalonePage];
    mockData.homeItems = [homeNote];
  });

  afterEach(() => {
    mockData.folders = originalFolders;
    mockData.pages = originalPages;
    mockData.homeItems = originalHomeItems;
  });

  it('opens, searches, and closes with folder results', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    expect(result.current.searchOpen).toBe(false);

    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('portfolio');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(entry => entry.type === 'folder')
      ).toBe(true)
    );

    act(() => {
      result.current.closeSearch();
    });

    expect(result.current.searchOpen).toBe(false);
    expect(result.current.searchQuery).toBe('');
  });

  it('returns work items from folders and home', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('sketch');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(entry => entry.type === 'work')
      ).toBe(true)
    );

    const workResult = result.current.searchResults.find(
      entry => entry.type === 'work'
    );
    expect(workResult).toBeDefined();
    expect(workResult?.folder.name).toBe('Portfolio');
  });

  it('returns standalone page matches', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('bio');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(entry => entry.type === 'page')
      ).toBe(true)
    );

    const pageResult = result.current.searchResults.find(
      entry => entry.type === 'page'
    );
    expect(pageResult?.page.id).toBe('bio');
  });
});
