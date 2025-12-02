import React from 'react';
import { Pin } from 'lucide-react';
import paperIcon from '@/assets/paper.gif';
import folderIcon from '@/assets/folder.gif';
import { Folder, Page } from '@/types';
import { FolderTreeItem } from './FolderTreeItem';
import styles from './Sidebar.module.css';

type SidebarEntry = Folder | Page;

interface SidebarSectionsProps {
  pinnedFolders: Folder[];
  pinnedPages: Page[];
  unpinnedFolders: Folder[];
  unpinnedPages: Page[];
  activePathSegments: Set<string>;
  expandedFolders: Set<string>;
  pinnedItems: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onNavigate: (item: SidebarEntry) => void;
  onContextMenu: (event: React.MouseEvent, item: SidebarEntry) => void;
}

export const SidebarSections: React.FC<SidebarSectionsProps> = ({
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
}) => {
  const renderEntry = (item: SidebarEntry, showPin = false) => {
    const isActive = activePathSegments.has(item.id);
    const isPinned = pinnedItems.has(item.id);
    const isFolder = item.type === 'folder';

    if (isFolder) {
      return (
        <div
          key={item.id}
          onContextMenu={event => onContextMenu(event, item)}
          className={styles['item-wrapper']}
        >
          <FolderTreeItem
            folder={item as Folder}
            depth={0}
            isExpanded={expandedFolders.has(item.id)}
            activePathSegments={activePathSegments}
            onToggle={onToggleFolder}
            onNavigate={onNavigate}
            expandedFolders={expandedFolders}
            isPinned={isPinned}
            onContextMenu={onContextMenu}
          />
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className={`${styles['sidebar-item']} ${isActive ? styles['sidebar-item--active'] : ''} ${isPinned && showPin ? styles['sidebar-item--pinned'] : ''}`}
        onClick={() => onNavigate(item)}
        onContextMenu={event => onContextMenu(event, item)}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={styles['expand-icon-spacer']} />
        <img
          className={styles['sidebar-icon']}
          src={isFolder ? folderIcon : paperIcon}
          alt={isFolder ? 'Folder icon' : 'Text file icon'}
          width="20"
          height="20"
        />
        <span className={styles['folder-name']}>{item.name}</span>
        {isPinned && showPin && (
          <Pin size={14} className={styles['pin-indicator']} />
        )}
      </button>
    );
  };

  return (
    <>
      {(pinnedFolders.length > 0 || pinnedPages.length > 0) && (
        <div className={styles['sidebar-section']}>
          <div className={styles['section-header']}>
            <Pin size={14} />
            <span>Pinned</span>
          </div>
          {pinnedFolders.map(folder => renderEntry(folder, true))}
          {pinnedPages.map(page => renderEntry(page, true))}
        </div>
      )}

      <div className={styles['sidebar-section']}>
        {unpinnedFolders.map(folder => renderEntry(folder))}
      </div>

      <div className={styles['sidebar-section']}>
        {unpinnedPages.map(page => renderEntry(page))}
      </div>
    </>
  );
};
