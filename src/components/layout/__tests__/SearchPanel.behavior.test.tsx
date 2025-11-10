import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SearchPanel from '../SearchPanel';
import styles from '../SearchPanel.module.css';

type FolderResult = {
  type: 'folder';
  id: string;
  label: string;
  path: string[];
  folder: { id: string; name: string; type: 'folder' };
};

type PageResult = {
  type: 'page';
  id: string;
  label: string;
  page: { id: string; name: string; type: 'txt'; content: string };
};

type WorkResult = {
  type: 'work';
  id: string;
  label: string;
  path: string[];
  folder: { id: string; name: string; type: 'folder'; items?: unknown[] };
  work: { id: string; filename: string; itemType: 'work' };
};

type MockSearchResult = FolderResult | PageResult | WorkResult;

const navigationMock = {
  navigateTo: vi.fn(),
  openLightbox: vi.fn(),
};

const searchState = {
  searchOpen: true,
  searchQuery: 'doc',
  searchResults: [] as MockSearchResult[],
  setSearchQuery: vi.fn(),
  openSearch: vi.fn(),
  closeSearch: vi.fn(),
};

vi.mock('@/contexts/SearchContext', () => ({
  useSearch: () => searchState,
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => navigationMock,
}));

const folderResult: FolderResult = {
  type: 'folder',
  id: 'folder-1',
  label: 'Folder',
  path: ['folder-1'],
  folder: { id: 'folder-1', name: 'Folder One', type: 'folder' },
};

const pageResult: PageResult = {
  type: 'page',
  id: 'page-1',
  label: 'Text File',
  page: { id: 'page-1', name: 'Doc', type: 'txt', content: 'Body' },
};

const workResult: WorkResult = {
  type: 'work',
  id: 'work-1',
  label: 'Work',
  path: ['folder-1'],
  folder: { id: 'folder-1', name: 'Folder One', type: 'folder' },
  work: { id: 'work-1', filename: 'work.png', itemType: 'work' },
};

const baseResults: MockSearchResult[] = [folderResult, pageResult, workResult];

const getResultButtonByLabel = (label: string) => {
  const buttons = screen.getAllByRole('button');
  const labelClass = styles['search-result-label'];

  const match = buttons.find(button => {
    const text = button.querySelector(`.${labelClass}`)?.textContent?.trim();
    return text === label;
  });

  if (!match) {
    throw new Error(`Could not find search result with label "${label}"`);
  }

  return match as HTMLButtonElement;
};

describe('SearchPanel interactions', () => {
  beforeEach(() => {
    navigationMock.navigateTo.mockClear();
    navigationMock.openLightbox.mockClear();
    searchState.setSearchQuery.mockClear();
    searchState.closeSearch.mockClear();
    searchState.searchResults = [...baseResults];
  });

  it('submits selection via keyboard navigation', async () => {
    render(<SearchPanel />);
    const folderButton = getResultButtonByLabel('Folder');
    expect(folderButton).toHaveClass(styles['search-result--selected']);

    await userEvent.keyboard('{ArrowDown}');
    const pageButton = getResultButtonByLabel('Text File');
    expect(pageButton).toHaveClass(styles['search-result--selected']);

    await userEvent.keyboard('{Enter}');
    expect(navigationMock.navigateTo).toHaveBeenCalledWith(pageResult.page);
    expect(searchState.closeSearch).toHaveBeenCalled();

     await userEvent.keyboard('{ArrowUp}');
     expect(folderButton).toHaveClass(styles['search-result--selected']);
  });

  it('invokes navigateTo for folder results and updates query text', async () => {
    render(<SearchPanel />);
    const input = screen.getByPlaceholderText(/type to search/i);
    await userEvent.type(input, '!');
    expect(searchState.setSearchQuery).toHaveBeenCalled();

    const folderButton = getResultButtonByLabel('Folder');
    await userEvent.click(folderButton);
    expect(navigationMock.navigateTo).toHaveBeenCalledWith(
      folderResult.folder,
      folderResult.path
    );
    expect(searchState.closeSearch).toHaveBeenCalled();
  });

  it('opens lightbox for work results', async () => {
    render(<SearchPanel />);
    const workButton = getResultButtonByLabel('Work');
    await userEvent.click(workButton);
    expect(navigationMock.openLightbox).toHaveBeenCalledWith(
      workResult.work,
      expect.any(Array)
    );
  });

  it('focuses the panel when no focusable elements are found', async () => {
    render(<SearchPanel />);
    const panel = screen.getByRole('dialog');
    const originalQuerySelectorAll = panel.querySelectorAll;
    panel.querySelectorAll =
      (() => [] as unknown as NodeListOf<Element>) as typeof panel.querySelectorAll;

    await userEvent.keyboard('{Tab}');
    expect(panel).toHaveFocus();

    panel.querySelectorAll = originalQuerySelectorAll;
  });

  it('closes the search panel when Escape is pressed', async () => {
    render(<SearchPanel />);
    await userEvent.keyboard('{Escape}');
    expect(searchState.closeSearch).toHaveBeenCalled();
  });
});
