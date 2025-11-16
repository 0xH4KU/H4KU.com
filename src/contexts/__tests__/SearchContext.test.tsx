import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  SearchProvider,
  useSearch,
  useSearchUI,
  useSearchResults,
  useSearchExecutor,
} from '@/contexts/SearchContext';
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
  title: 'Color Theory Notes',
  description: 'Detailed figure study reference',
  tags: ['vibrant', 'portfolio'],
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
  content: 'home note secret body content',
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

  it('includes home folder work and clears results when query is blank', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('home note');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry => entry.type === 'work' && entry.path?.[0] === 'home'
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('   ');
    });

    await waitFor(() => expect(result.current.searchResults.length).toBe(0));
  });

  it('matches work items by title, description, tags, and text content', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('color theory');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry => entry.type === 'work' && entry.work?.title?.includes('Color')
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('figure study');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(entry =>
          entry.type === 'work'
            ? entry.work?.description?.includes('figure')
            : false
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('vibrant');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(entry =>
          entry.type === 'work' ? entry.work?.tags?.includes('vibrant') : false
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('secret body');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry => entry.type === 'work' && entry.path?.[0] === 'home'
        )
      ).toBe(true)
    );
  });

  it('skips home folder search when there are no home items', async () => {
    mockData.homeItems = [];
    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('secret body');
    });

    await waitFor(() => expect(result.current.searchResults.length).toBe(0));
  });

  it('allows consumers to run ad-hoc searches via executor hook', () => {
    const { result } = renderHook(() => useSearchExecutor(), { wrapper });
    const { runSearch } = result.current;
    const results = runSearch('portfolio');
    expect(results.some(entry => entry.type === 'folder')).toBe(true);
  });

  it('falls back to identifiers when labels are missing', async () => {
    const unlabeledWork: WorkItem = {
      itemType: 'work',
      id: 'bare-work',
      filename: '',
      title: '',
      description: 'untitled fallback asset',
      thumb: '/bare-thumb.jpg',
      full: '/bare-full.jpg',
    };
    const unlabeledPage: Page = {
      id: 'bare-page',
      name: '',
      filename: '',
      type: 'txt',
      content: 'page fallback narrative',
    };
    const unlabeledHome: WorkItem = {
      itemType: 'page',
      id: 'home-bare',
      filename: '',
      title: '',
      content: 'home fallback article',
    };

    mockData.folders = [
      {
        id: 'fallback',
        name: 'Fallbacks',
        type: 'folder',
        parentId: null,
        items: [unlabeledWork],
        children: [],
      },
    ];
    mockData.pages = [unlabeledPage];
    mockData.homeItems = [unlabeledHome];

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.openSearch();
      result.current.setSearchQuery('fallback asset');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry => entry.type === 'work' && entry.label === 'bare-work'
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('fallback narrative');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry => entry.type === 'page' && entry.label === 'bare-page'
        )
      ).toBe(true)
    );

    act(() => {
      result.current.setSearchQuery('home fallback article');
    });

    await waitFor(() =>
      expect(
        result.current.searchResults.some(
          entry =>
            entry.type === 'work' &&
            entry.path?.[0] === 'home' &&
            entry.label === 'home-bare'
        )
      ).toBe(true)
    );
  });
});

describe('Search hooks guard rails', () => {
  it('throws when useSearchUI is called outside the provider', () => {
    expect(() => renderHook(() => useSearchUI())).toThrow(
      /within SearchProvider/i
    );
  });

  it('throws when useSearchResults is called outside the provider', () => {
    expect(() => renderHook(() => useSearchResults())).toThrow(
      /within SearchProvider/i
    );
  });

  it('throws when useSearchExecutor is called outside the provider', () => {
    expect(() => renderHook(() => useSearchExecutor())).toThrow(
      /within SearchProvider/i
    );
  });
});
