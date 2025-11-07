import React from 'react';
import { ChevronRight, Pin } from 'lucide-react';
import folderIcon from '@/assets/folder.gif';
import { Folder } from '@/types';
import { Tooltip } from './Tooltip';
import styles from './Sidebar.module.css';

interface FolderTreeItemProps {
  folder: Folder;
  depth: number;
  isExpanded: boolean;
  activePathSegments: Set<string>;
  onToggle: (folderId: string) => void;
  onNavigate: (folder: Folder) => void;
  expandedFolders: Set<string>;
  isPinned?: boolean;
  onContextMenu?: (event: React.MouseEvent, item: Folder) => void;
}

export const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  folder,
  depth,
  isExpanded,
  activePathSegments,
  onToggle,
  onNavigate,
  expandedFolders,
  isPinned = false,
  onContextMenu,
}) => {
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = activePathSegments.has(folder.id);

  const handleRowClick = () => {
    onNavigate(folder);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onContextMenu) {
      event.preventDefault();
      onContextMenu(event, folder);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'Spacebar'
    ) {
      event.preventDefault();
      handleRowClick();
    }
  };

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle(folder.id);
  };

  // Determine icon size and indent based on screen size
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
  const iconSize = isDesktop ? 16 : 18;
  const indent = isDesktop ? 18 + depth * 20 : 20 + depth * 24;
  const childFolders = folder.children ?? [];

  return (
    <>
      <Tooltip content={folder.name}>
        <div
          className={`${styles['sidebar-item']} ${isActive ? styles['sidebar-item--active'] : ''} ${isPinned ? styles['sidebar-item--pinned'] : ''}`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={handleRowClick}
          onContextMenu={handleContextMenu}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {hasChildren && (
            <button
              type="button"
              className={`${styles['expand-icon']} ${isExpanded ? styles['expand-icon--expanded'] : ''}`}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${folder.name}`}
              aria-expanded={isExpanded}
              onClick={handleToggleClick}
            >
              <ChevronRight size={iconSize} />
            </button>
          )}
          {!hasChildren && <span className={styles['expand-icon-spacer']} />}
          <img
            className={styles['sidebar-icon']}
            src={folderIcon}
            alt="Folder icon"
          />
          <span className={styles['folder-name']}>{folder.name}</span>
          {isPinned && <Pin size={14} className={styles['pin-indicator']} />}
        </div>
      </Tooltip>
      {hasChildren && isExpanded && (
        <>
          {childFolders.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              isExpanded={expandedFolders.has(child.id)}
              activePathSegments={activePathSegments}
              onToggle={onToggle}
              onNavigate={onNavigate}
              expandedFolders={expandedFolders}
              isPinned={false}
              onContextMenu={onContextMenu}
            />
          ))}
        </>
      )}
    </>
  );
};
