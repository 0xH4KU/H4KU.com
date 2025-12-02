import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Folder, Page } from '@/types';
import { SidebarSections } from '../SidebarSections';

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
  content: 'Hello',
  ...overrides,
});

describe('SidebarSections', () => {
  const activePathSegments = new Set<string>();
  const expandedFolders = new Set<string>();
  const pinnedItems = new Set<string>();

  beforeEach(() => {
    activePathSegments.clear();
    expandedFolders.clear();
    pinnedItems.clear();
  });

  it('renders pinned section when there are pinned folders or pages', () => {
    const pinnedFolder = createFolder();
    const pinnedPage = createPage();

    pinnedItems.add(pinnedFolder.id);
    pinnedItems.add(pinnedPage.id);
    expandedFolders.add(pinnedFolder.id);

    render(
      <SidebarSections
        pinnedFolders={[pinnedFolder]}
        pinnedPages={[pinnedPage]}
        unpinnedFolders={[]}
        unpinnedPages={[]}
        activePathSegments={activePathSegments}
        expandedFolders={expandedFolders}
        pinnedItems={pinnedItems}
        onToggleFolder={vi.fn()}
        onNavigate={vi.fn()}
        onContextMenu={vi.fn()}
      />
    );

    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Folder One')).toBeInTheDocument();
    expect(screen.getByText('Page One')).toBeInTheDocument();
  });

  it('does not render pinned section when there are no pinned items', () => {
    const folder = createFolder({ id: 'folder-2', name: 'Folder Two' });
    const page = createPage({ id: 'page-2', name: 'Page Two' });

    render(
      <SidebarSections
        pinnedFolders={[]}
        pinnedPages={[]}
        unpinnedFolders={[folder]}
        unpinnedPages={[page]}
        activePathSegments={activePathSegments}
        expandedFolders={expandedFolders}
        pinnedItems={pinnedItems}
        onToggleFolder={vi.fn()}
        onNavigate={vi.fn()}
        onContextMenu={vi.fn()}
      />
    );

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
    expect(screen.getByText('Folder Two')).toBeInTheDocument();
    expect(screen.getByText('Page Two')).toBeInTheDocument();
  });

  it('invokes onNavigate when a page item is clicked', () => {
    const page = createPage();
    const onNavigate = vi.fn();

    render(
      <SidebarSections
        pinnedFolders={[]}
        pinnedPages={[]}
        unpinnedFolders={[]}
        unpinnedPages={[page]}
        activePathSegments={activePathSegments}
        expandedFolders={expandedFolders}
        pinnedItems={pinnedItems}
        onToggleFolder={vi.fn()}
        onNavigate={onNavigate}
        onContextMenu={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Page One/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(page);
  });

  it('invokes onContextMenu when a page item is right-clicked', () => {
    const page = createPage();
    const onContextMenu = vi.fn();

    render(
      <SidebarSections
        pinnedFolders={[]}
        pinnedPages={[]}
        unpinnedFolders={[]}
        unpinnedPages={[page]}
        activePathSegments={activePathSegments}
        expandedFolders={expandedFolders}
        pinnedItems={pinnedItems}
        onToggleFolder={vi.fn()}
        onNavigate={vi.fn()}
        onContextMenu={onContextMenu}
      />
    );

    const button = screen.getByRole('button', { name: /Page One/i });
    fireEvent.contextMenu(button);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    // 第二個參數是 SidebarEntry，本測試只需要確認有帶入原始 item 即可。
    expect(onContextMenu.mock.calls[0][1]).toEqual(page);
  });
});
