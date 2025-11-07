import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, X, ChevronsDown, ChevronsUp, Pin } from 'lucide-react';
import paperIcon from '@/assets/paper.gif';
import folderIcon from '@/assets/folder.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSearch } from '@/contexts/SearchContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useSidebar } from '@/hooks/useSidebar';
import { useWindowSize } from '@/hooks/useWindowSize';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult } from '@/types';
import { SIDEBAR_CONFIG } from '@/config/constants';
import { FolderTreeItem } from './FolderTreeItem';
import { ContextMenu } from './ContextMenu';
import { Tooltip } from './Tooltip';
import styles from './Sidebar.module.css';

type SidebarEntry = Folder | Page;

const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    closeSidebar,
    expandedFolders,
    toggleFolder,
    expandFolder,
    expandAll,
    collapseAll,
    pinnedItems,
    togglePin,
  } = useSidebarContext();
  const { searchQuery, setSearchQuery, searchResults } = useSearch();
  const { activePath, navigateTo, openLightbox, resetToHome, allFolders } =
    useNavigation();
  const { sidebarWidth, startDrag } = useSidebar();
  const { width } = useWindowSize();
  const { folders, pages, socials } = mockData;
  const isMobile =
    width !== undefined && width < SIDEBAR_CONFIG.MOBILE_BREAKPOINT;

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: SidebarEntry;
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const activeSegments = useMemo(
    () => activePath.split('/').filter(Boolean),
    [activePath]
  );
  const activePathSegments = useMemo(
    () => new Set(activeSegments),
    [activeSegments]
  );
  const folderIdSet = useMemo(
    () => new Set(allFolders.map(flatFolder => flatFolder.folder.id)),
    [allFolders]
  );

  const getItemUrl = useCallback(
    (item: SidebarEntry) => {
      if (typeof window === 'undefined') {
        return '';
      }

      const origin = window.location.origin;
      const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

      if (item.type === 'folder') {
        const flatFolder = allFolders.find(flat => flat.folder.id === item.id);
        if (!flatFolder) {
          return origin;
        }
        const folderPath = flatFolder.path.join('/');
        return `${origin}${basePath}/folder/${folderPath}`;
      }

      if (item.type === 'txt') {
        return `${origin}${basePath}/page/${item.id}`;
      }

      return origin;
    },
    [allFolders]
  );

  // Group items by pinned status
  const { pinnedFolders, unpinnedFolders } = useMemo(() => {
    const pinned: Folder[] = [];
    const unpinned: Folder[] = [];
    folders.forEach(folder => {
      if (pinnedItems.has(folder.id)) {
        pinned.push(folder);
      } else {
        unpinned.push(folder);
      }
    });
    return { pinnedFolders: pinned, unpinnedFolders: unpinned };
  }, [folders, pinnedItems]);

  const { pinnedPages, unpinnedPages } = useMemo(() => {
    const pinned: Page[] = [];
    const unpinned: Page[] = [];
    pages.forEach(page => {
      if (pinnedItems.has(page.id)) {
        pinned.push(page);
      } else {
        unpinned.push(page);
      }
    });
    return { pinnedPages: pinned, unpinnedPages: unpinned };
  }, [pages, pinnedItems]);

  useEffect(() => {
    activeSegments.forEach(segment => {
      if (
        segment !== 'home' &&
        folderIdSet.has(segment) &&
        !expandedFolders.has(segment)
      ) {
        expandFolder(segment);
      }
    });
  }, [activeSegments, expandFolder, expandedFolders, folderIdSet]);

  const handleNavigate = useCallback(
    (item: SidebarEntry) => {
      navigateTo(item);
      if (isMobile) {
        closeSidebar();
      }
    },
    [navigateTo, isMobile, closeSidebar]
  );

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'folder') {
        navigateTo(result.folder, result.path);
      } else if (result.type === 'page') {
        navigateTo(result.page);
      } else if (result.type === 'work') {
        const gallery = result.folder.items || [];
        openLightbox(result.work, gallery);
      }
      if (isMobile) {
        closeSidebar();
      }
    },
    [navigateTo, openLightbox, isMobile, closeSidebar]
  );

  const handleDragStart = () => {
    startDrag();
  };

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, item: SidebarEntry) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        item,
      });
    },
    []
  );

  const handleExpandAll = useCallback(() => {
    const allFolderIds = allFolders.map(f => f.folder.id);
    expandAll(allFolderIds);
  }, [allFolders, expandAll]);

  const handleCopyLink = useCallback(
    (item: SidebarEntry) => {
      const url = getItemUrl(item);
      if (!url) {
        return;
      }

      navigator.clipboard.writeText(url).catch(error => {
        console.error('Failed to copy link:', error);
      });
    },
    [getItemUrl]
  );

  const handleOpenInNewTab = useCallback(
    (item: SidebarEntry) => {
      const url = getItemUrl(item);
      if (!url || typeof window === 'undefined') {
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [getItemUrl]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSidebarOpen) return;

      // If searching, navigate search results
      if (searchQuery.trim() && searchResults.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setFocusedIndex(prev =>
              prev < searchResults.length - 1 ? prev + 1 : prev
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
            break;
          case 'Enter':
            if (focusedIndex >= 0 && searchResults[focusedIndex]) {
              handleSearchResultSelect(searchResults[focusedIndex]);
            }
            break;
          case 'Escape':
            setSearchQuery('');
            break;
        }
      } else {
        // Navigate normal sidebar items
        const allVisibleItems = [
          ...pinnedFolders,
          ...unpinnedFolders,
          ...pinnedPages,
          ...unpinnedPages,
        ];

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setFocusedIndex(prev =>
              prev < allVisibleItems.length - 1 ? prev + 1 : prev
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
            break;
          case 'Enter':
            if (focusedIndex >= 0 && allVisibleItems[focusedIndex]) {
              handleNavigate(allVisibleItems[focusedIndex]);
            }
            break;
          case 'Escape':
            if (searchQuery) {
              setSearchQuery('');
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSidebarOpen,
    focusedIndex,
    searchQuery,
    searchResults,
    pinnedFolders,
    unpinnedFolders,
    pinnedPages,
    unpinnedPages,
    handleNavigate,
    handleSearchResultSelect,
    setSearchQuery,
  ]);

  const renderItem = (item: SidebarEntry, showPin = false) => {
    const isActive = activePathSegments.has(item.id);
    const isPinned = pinnedItems.has(item.id);
    const isFolder = item.type === 'folder';

    if (isFolder) {
      return (
        <div
          key={item.id}
          onContextMenu={e => handleContextMenu(e, item)}
          className={styles['item-wrapper']}
        >
          <FolderTreeItem
            folder={item as Folder}
            depth={0}
            isExpanded={expandedFolders.has(item.id)}
            activePathSegments={activePathSegments}
            onToggle={toggleFolder}
            onNavigate={handleNavigate}
            expandedFolders={expandedFolders}
            isPinned={isPinned}
            onContextMenu={handleContextMenu}
          />
        </div>
      );
    }

    return (
      <Tooltip key={item.id} content={item.name}>
        <div
          className={`${styles['sidebar-item']} ${isActive ? styles['sidebar-item--active'] : ''} ${isPinned && showPin ? styles['sidebar-item--pinned'] : ''}`}
          onClick={() => handleNavigate(item)}
          onContextMenu={e => handleContextMenu(e, item)}
        >
          <span className={styles['expand-icon-spacer']} />
          <img
            className={styles['sidebar-icon']}
            src={isFolder ? folderIcon : paperIcon}
            alt={isFolder ? 'Folder icon' : 'Text file icon'}
          />
          <span className={styles['folder-name']}>{item.name}</span>
          {isPinned && showPin && (
            <Pin size={14} className={styles['pin-indicator']} />
          )}
        </div>
      </Tooltip>
    );
  };

  const renderSearchResult = (result: SearchResult, index: number) => {
    const isSelected = index === focusedIndex;
    let label = '';
    let meta = '';

    switch (result.type) {
      case 'folder':
        label = result.folder.name;
        meta = `Folder • lum.bio/${result.path.join('/')}`;
        break;
      case 'page':
        label = result.page.name;
        meta = `Text • lum.bio/${result.page.id}`;
        break;
      case 'work':
        label = result.work.filename;
        meta = `Work • lum.bio/${result.path.join('/')}`;
        break;
    }

    return (
      <div
        key={`${result.type}-${result.id}`}
        className={`${styles['search-result']} ${isSelected ? styles['search-result--selected'] : ''}`}
        onClick={() => handleSearchResultSelect(result)}
      >
        <div className={styles['search-result-label']}>{label}</div>
        <div className={styles['search-result-meta']}>{meta}</div>
      </div>
    );
  };

  return (
    <div
      id="app-sidebar"
      className={`${styles.sidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}
      style={{ width: !isSidebarOpen ? 0 : sidebarWidth }}
      aria-hidden={!isSidebarOpen}
    >
      <div className={styles['sidebar-header']}>
        <button
          className={styles['logo-button']}
          onClick={() => {
            resetToHome();
            if (isMobile) {
              closeSidebar();
            }
          }}
          aria-label="Go to home"
        >
          LUM.BIO
        </button>
        <div className={styles['header-controls']}>
          <Tooltip content="Expand all folders">
            <button
              className={styles['control-button']}
              onClick={handleExpandAll}
              aria-label="Expand all folders"
            >
              <ChevronsDown size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Collapse all folders">
            <button
              className={styles['control-button']}
              onClick={collapseAll}
              aria-label="Collapse all folders"
            >
              <ChevronsUp size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className={styles['search-container']}>
        <Search size={16} className={styles['search-icon']} />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles['search-input']}
          aria-label="Search sidebar items"
        />
        {searchQuery && (
          <button
            className={styles['search-clear']}
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles['sidebar-content']}>
        {searchQuery.trim() ? (
          // Show search results
          <>
            {searchResults.length === 0 && (
              <div className={styles['empty-state']}>
                <Search size={32} />
                <p>No results found</p>
                <span>Try a different search term</span>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className={styles['search-results-container']}>
                {searchResults.map((result, index) =>
                  renderSearchResult(result, index)
                )}
              </div>
            )}
          </>
        ) : (
          // Show normal sidebar
          <>
            {(pinnedFolders.length > 0 || pinnedPages.length > 0) && (
              <div className={styles['sidebar-section']}>
                <div className={styles['section-header']}>
                  <Pin size={14} />
                  <span>Pinned</span>
                </div>
                {pinnedFolders.map(folder => renderItem(folder, true))}
                {pinnedPages.map(page => renderItem(page, true))}
              </div>
            )}

            <div className={styles['sidebar-section']}>
              {unpinnedFolders.map(folder => renderItem(folder))}
            </div>

            <div className={styles['sidebar-section']}>
              {unpinnedPages.map(page => renderItem(page))}
            </div>
          </>
        )}
      </div>

      <div className={styles['sidebar-footer']}>
        {socials.map(social => {
          const rawUrl = social.url ?? '';
          const url = rawUrl.trim();
          const isPlaceholder = url.length === 0 || url === '#';
          const isExternal = /^https?:\/\//i.test(url);

          if (isPlaceholder) {
            return (
              <button
                key={social.code}
                type="button"
                className={`${styles['social-link']} ${styles['social-link--disabled']}`}
                disabled
                aria-disabled="true"
                aria-label={`${social.name} coming soon`}
              >
                {social.code}
              </button>
            );
          }

          const isMailto = url.startsWith('mailto:');
          const ariaLabelParts = [`Open ${social.name}`];
          if (isMailto) {
            ariaLabelParts.push('(opens email client)');
          }
          if (isExternal) {
            ariaLabelParts.push('(opens in new tab)');
          }

          return (
            <a
              key={social.code}
              href={url}
              className={styles['social-link']}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              aria-label={ariaLabelParts.join(' ')}
            >
              {social.code}
            </a>
          );
        })}
      </div>

      <div className={styles['resize-handle']} onMouseDown={handleDragStart} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          itemId={contextMenu.item.id}
          itemName={contextMenu.item.name}
          itemType={contextMenu.item.type === 'folder' ? 'folder' : 'page'}
          isPinned={pinnedItems.has(contextMenu.item.id)}
          onTogglePin={() => togglePin(contextMenu.item.id)}
          onCopyLink={() => handleCopyLink(contextMenu.item)}
          onOpen={() => handleNavigate(contextMenu.item)}
          onOpenInNewTab={() => handleOpenInNewTab(contextMenu.item)}
        />
      )}
    </div>
  );
};

export default Sidebar;
