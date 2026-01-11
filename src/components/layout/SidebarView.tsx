import React from 'react';
import { SIDEBAR_CONFIG } from '@/config/constants';
import type { Folder, Page, Social, SearchResult } from '@/types';
import { ContextMenu } from './ContextMenu';
import { SidebarFooter } from './SidebarFooter';
import { SidebarFilter } from './SidebarFilter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSearchResults } from './SidebarSearchResults';
import { SidebarSections } from './SidebarSections';
import type { SidebarEntry } from './Sidebar.types';
import styles from './Sidebar.module.css';

interface ContextMenuState {
  x: number;
  y: number;
  item: SidebarEntry;
}

interface SidebarViewProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
  normalizedSidebarWidth: number;
  inertProps: Record<string, unknown>;
  sidebarRef: React.RefObject<HTMLDivElement>;
  resetToHome: () => void;
  closeSidebar: () => void;
  allFoldersExpanded: boolean;
  onToggleAll: () => void;
  sidebarQuery: string;
  setSidebarQuery: (value: string) => void;
  sidebarResults: SearchResult[];
  focusedIndex: number;
  onSearchResultSelect: (result: SearchResult) => void;
  pinnedFolders: Folder[];
  pinnedPages: Page[];
  unpinnedFolders: Folder[];
  unpinnedPages: Page[];
  activePathSegments: Set<string>;
  expandedFolders: Set<string>;
  pinnedItems: Set<string>;
  onToggleFolder: (id: string) => void;
  onNavigate: (item: SidebarEntry) => void;
  onContextMenu: (event: React.MouseEvent, item: SidebarEntry) => void;
  socials: Social[];
  resizeHandleRef: React.RefObject<HTMLDivElement>;
  onResizeStart: (event: React.MouseEvent | React.TouchEvent) => void;
  onResizeKeyDown: (event: React.KeyboardEvent) => void;
  contextMenu: ContextMenuState | null;
  onCloseContextMenu: () => void;
  onTogglePin: (id: string) => void;
  onCopyLink: (item: SidebarEntry) => void;
  onOpenInNewTab: (item: SidebarEntry) => void;
}

export const SidebarView: React.FC<SidebarViewProps> = ({
  isSidebarOpen,
  isMobile,
  normalizedSidebarWidth,
  inertProps,
  sidebarRef,
  resetToHome,
  closeSidebar,
  allFoldersExpanded,
  onToggleAll,
  sidebarQuery,
  setSidebarQuery,
  sidebarResults,
  focusedIndex,
  onSearchResultSelect,
  pinnedFolders,
  pinnedPages,
  unpinnedFolders,
  unpinnedPages,
  activePathSegments,
  expandedFolders,
  pinnedItems,
  onToggleFolder,
  onNavigate,
  onContextMenu,
  socials,
  resizeHandleRef,
  onResizeStart,
  onResizeKeyDown,
  contextMenu,
  onCloseContextMenu,
  onTogglePin,
  onCopyLink,
  onOpenInNewTab,
}) => (
  <nav
    id="app-sidebar"
    ref={sidebarRef}
    className={`${styles.sidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}
    style={{ width: isMobile ? undefined : normalizedSidebarWidth }}
    aria-hidden={!isSidebarOpen}
    {...inertProps}
  >
    <SidebarHeader
      allFoldersExpanded={allFoldersExpanded}
      onToggleAll={onToggleAll}
      onLogoClick={() => {
        resetToHome();
        if (isMobile) {
          closeSidebar();
        }
      }}
    />

    <SidebarFilter query={sidebarQuery} onQueryChange={setSidebarQuery} />

    <div className={styles['sidebar-content']}>
      {sidebarQuery.trim() ? (
        <SidebarSearchResults
          results={sidebarResults}
          focusedIndex={focusedIndex}
          onSelect={onSearchResultSelect}
        />
      ) : (
        <SidebarSections
          pinnedFolders={pinnedFolders}
          pinnedPages={pinnedPages}
          unpinnedFolders={unpinnedFolders}
          unpinnedPages={unpinnedPages}
          activePathSegments={activePathSegments}
          expandedFolders={expandedFolders}
          pinnedItems={pinnedItems}
          onToggleFolder={onToggleFolder}
          onNavigate={onNavigate}
          onContextMenu={onContextMenu}
        />
      )}
    </div>

    <SidebarFooter socials={socials} />

    <div
      ref={resizeHandleRef}
      className={styles['resize-handle']}
      role="separator"
      tabIndex={0}
      aria-label="Resize sidebar"
      aria-controls="app-sidebar"
      aria-orientation="vertical"
      aria-valuemin={SIDEBAR_CONFIG.MIN_WIDTH}
      aria-valuemax={SIDEBAR_CONFIG.MAX_WIDTH}
      aria-valuenow={Math.round(normalizedSidebarWidth)}
      aria-valuetext={`${Math.round(normalizedSidebarWidth)} pixels`}
      onMouseDown={onResizeStart}
      onTouchStart={onResizeStart}
      onKeyDown={onResizeKeyDown}
    />

    {contextMenu && (
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={onCloseContextMenu}
        itemId={contextMenu.item.id}
        itemName={contextMenu.item.name}
        itemType={contextMenu.item.type === 'folder' ? 'folder' : 'page'}
        isPinned={pinnedItems.has(contextMenu.item.id)}
        onTogglePin={() => onTogglePin(contextMenu.item.id)}
        onCopyLink={() => onCopyLink(contextMenu.item)}
        onOpen={() => onNavigate(contextMenu.item)}
        onOpenInNewTab={() => onOpenInNewTab(contextMenu.item)}
      />
    )}
  </nav>
);
