import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Folder, Page, SearchResult } from '@/types';
import { SidebarSearchResults } from '../SidebarSearchResults';

const createFolderResult = (): SearchResult => {
  const folder: Folder = {
    id: 'folder-1',
    name: 'Folder One',
    type: 'folder',
    children: [],
    items: [],
  };

  return {
    type: 'folder',
    id: folder.id,
    label: folder.name,
    path: ['folder-1'],
    folder,
  };
};

const createPageResult = (): SearchResult => {
  const page: Page = {
    id: 'page-1',
    name: 'Doc',
    type: 'txt',
    content: 'Body',
  };

  return {
    type: 'page',
    id: page.id,
    label: page.name,
    page,
  };
};

describe('SidebarSearchResults', () => {
  it('renders empty state when there are no results', () => {
    const onSelect = vi.fn();
    render(
      <SidebarSearchResults results={[]} focusedIndex={0} onSelect={onSelect} />
    );

    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Try a different search term/i)
    ).toBeInTheDocument();
  });

  it('renders results and marks the focused result via aria-selected', () => {
    const folderResult = createFolderResult();
    const pageResult = createPageResult();
    const onSelect = vi.fn();

    render(
      <SidebarSearchResults
        results={[folderResult, pageResult]}
        focusedIndex={1}
        onSelect={onSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    // 第一個結果未被 focus
    expect(buttons[0]).toHaveAttribute('aria-selected', 'false');
    // 第二個結果是 focus 項目
    expect(buttons[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('invokes onSelect with the clicked result', () => {
    const folderResult = createFolderResult();
    const pageResult = createPageResult();
    const onSelect = vi.fn();

    render(
      <SidebarSearchResults
        results={[folderResult, pageResult]}
        focusedIndex={0}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Doc/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(pageResult);
  });
});
