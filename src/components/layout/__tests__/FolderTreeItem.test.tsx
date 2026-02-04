import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderTreeItem } from '../FolderTreeItem';
import type { Folder } from '@/types';
import sidebarStyles from '../Sidebar.module.css';

describe('FolderTreeItem', () => {
  const mockOnToggle = vi.fn();
  const mockOnNavigate = vi.fn();
  const mockOnContextMenu = vi.fn();

  const baseFolder: Folder = {
    id: 'test-folder',
    name: 'Test Folder',
    type: 'folder',
    children: [],
    items: [],
  };

  const folderWithChildren: Folder = {
    id: 'parent',
    name: 'Parent Folder',
    type: 'folder',
    children: [
      {
        id: 'child-1',
        name: 'Child One',
        type: 'folder',
        children: [],
        items: [],
      },
    ],
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders folder name', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(screen.getByText('Test Folder')).toBeInTheDocument();
    });

    it('renders folder icon', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(screen.getByAltText('Folder icon')).toBeInTheDocument();
    });

    it('renders expand button for folders with children', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(
        screen.getByRole('button', { name: /Expand Parent Folder/i })
      ).toBeInTheDocument();
    });

    it('shows collapse label when expanded', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={true}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(
        screen.getByRole('button', { name: /Collapse Parent Folder/i })
      ).toBeInTheDocument();
    });

    it('does not render expand button for folders without children', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(
        screen.queryByRole('button', { name: /Expand/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('applies active class when folder is in active path', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set(['test-folder'])}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(row.className).toContain('active');
    });

    it('does not apply active class when folder is not in path', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set(['other-folder'])}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(row.className).not.toContain('sidebar-item--active');
    });
  });

  describe('Pinned State', () => {
    it('renders pin indicator when isPinned is true', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
          isPinned={true}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(row.className).toContain('pinned');
    });

    it('does not render pin indicator when isPinned is false', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
          isPinned={false}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(row.className).not.toContain('sidebar-item--pinned');
    });
  });

  describe('Click Interactions', () => {
    it('calls onNavigate when row is clicked', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      fireEvent.click(screen.getByText('Test Folder'));
      expect(mockOnNavigate).toHaveBeenCalledWith(baseFolder);
    });

    it('calls onToggle when expand button is clicked', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      fireEvent.click(
        screen.getByRole('button', { name: /Expand Parent Folder/i })
      );
      expect(mockOnToggle).toHaveBeenCalledWith('parent');
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Context Menu', () => {
    it('calls onContextMenu when right-clicked', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
          onContextMenu={mockOnContextMenu}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      fireEvent.contextMenu(row);

      expect(mockOnContextMenu).toHaveBeenCalledWith(
        expect.any(Object),
        baseFolder
      );
    });

    it('does not throw when onContextMenu is not provided', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(() => fireEvent.contextMenu(row)).not.toThrow();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates on Enter key', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      fireEvent.keyDown(row, { key: 'Enter' });

      expect(mockOnNavigate).toHaveBeenCalledWith(baseFolder);
    });

    it('navigates on Space key', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      fireEvent.keyDown(row, { key: ' ' });

      expect(mockOnNavigate).toHaveBeenCalledWith(baseFolder);
    });

    it('navigates on Spacebar key (legacy)', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      fireEvent.keyDown(row, { key: 'Spacebar' });

      expect(mockOnNavigate).toHaveBeenCalledWith(baseFolder);
    });

    it('does not navigate on other keys', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      fireEvent.keyDown(row, { key: 'Tab' });

      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Children Rendering', () => {
    it('renders children when expanded', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={true}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(screen.getByText('Parent Folder')).toBeInTheDocument();
      expect(screen.getByText('Child One')).toBeInTheDocument();
    });

    it('does not render children when collapsed', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      expect(screen.getByText('Parent Folder')).toBeInTheDocument();
      expect(screen.queryByText('Child One')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('uses desktop sizing when window is wide', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });

      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByText('Parent Folder').closest('[role="button"]');
      if (!row) {
        throw new Error('Folder row not found');
      }
      expect(row.getAttribute('style')).toBeNull();
      expect(row.className).toContain(sidebarStyles['indent-0']);

      const expandBtn = screen.getByRole('button', {
        name: /Expand Parent Folder/i,
      });
      const icon = expandBtn.querySelector('svg');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    it('uses mobile sizing when window is narrow', () => {
      Object.defineProperty(window, 'innerWidth', { value: 480 });

      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByText('Parent Folder').closest('[role="button"]');
      if (!row) {
        throw new Error('Folder row not found');
      }
      expect(row.getAttribute('style')).toBeNull();
      expect(row.className).toContain(sidebarStyles['indent-0']);

      const expandBtn = screen.getByRole('button', {
        name: /Expand Parent Folder/i,
      });
      const icon = expandBtn.querySelector('svg');
      expect(icon).toHaveAttribute('width', '18');
      expect(icon).toHaveAttribute('height', '18');
    });
  });

  describe('Accessibility', () => {
    it('has proper role and tabIndex', () => {
      render(
        <FolderTreeItem
          folder={baseFolder}
          depth={0}
          isExpanded={false}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const row = screen.getByRole('button', { name: /Test Folder/i });
      expect(row).toHaveAttribute('tabIndex', '0');
    });

    it('expand button has proper aria-expanded attribute', () => {
      render(
        <FolderTreeItem
          folder={folderWithChildren}
          depth={0}
          isExpanded={true}
          activePathSegments={new Set()}
          onToggle={mockOnToggle}
          onNavigate={mockOnNavigate}
          expandedFolders={new Set()}
        />
      );

      const expandBtn = screen.getByRole('button', {
        name: /Collapse Parent Folder/i,
      });
      expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
