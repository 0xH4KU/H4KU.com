import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Search, X, ChevronsDown, ChevronsUp, Pin } from 'lucide-react';
import paperIcon from '@/assets/paper.gif';
import folderIcon from '@/assets/folder.gif';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSearchResults, useSearchUI } from '@/contexts/SearchContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult } from '@/types';
import { SIDEBAR_CONFIG } from '@/config/constants';
import { getSafeUrl } from '@/utils/urlHelpers';
import { FolderTreeItem } from './FolderTreeItem';
import { ContextMenu } from './ContextMenu';
import { Tooltip } from './Tooltip';
import styles from './Sidebar.module.css';

type SidebarEntry = Folder | Page;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DATASET_KEY = 'sidebarTabindex';
const DATASET_NONE = '__sidebar_none__';

const hasInertSupport = () => {
  if (typeof HTMLElement === 'undefined') {
    return false;
  }
  return (
    'inert' in (HTMLElement.prototype as HTMLElement & { inert?: unknown })
  );
};

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
    sidebarWidth,
    setSidebarWidth,
  } = useSidebarContext();
  const { searchQuery, setSearchQuery } = useSearchUI();
  const { searchResults } = useSearchResults();
  const { activePath, navigateTo, openLightbox, resetToHome, allFolders } =
    useNavigation();
  const { width } = useWindowSize();
  const { folders, pages, socials } = mockData;
  const isMobile =
    width !== undefined && width < SIDEBAR_CONFIG.MOBILE_BREAKPOINT;

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: SidebarEntry;
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const supportsInert = useMemo(() => hasInertSupport(), []);

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
    setIsDragging(true);
  };

  // Handle sidebar resize
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const clamped = Math.min(
        Math.max(event.clientX, SIDEBAR_CONFIG.MIN_WIDTH),
        SIDEBAR_CONFIG.MAX_WIDTH
      );
      setSidebarWidth(clamped);
    };

    const stopDrag = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging, setSidebarWidth]);

  useEffect(() => {
    if (supportsInert || !sidebarRef.current) {
      return;
    }

    const focusableElements =
      sidebarRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    focusableElements.forEach(element => {
      if (!isSidebarOpen) {
        if (!element.dataset[DATASET_KEY]) {
          const existing = element.getAttribute('tabindex');
          element.dataset[DATASET_KEY] = existing ?? DATASET_NONE;
        }
        element.setAttribute('tabindex', '-1');
        element.setAttribute('aria-hidden', 'true');
      } else {
        const stored = element.dataset[DATASET_KEY];
        if (stored) {
          if (stored !== DATASET_NONE) {
            element.setAttribute('tabindex', stored);
          } else {
            element.removeAttribute('tabindex');
          }
          delete element.dataset[DATASET_KEY];
        } else {
          element.removeAttribute('tabindex');
        }
        element.removeAttribute('aria-hidden');
      }
    });

    return () => {
      focusableElements.forEach(element => {
        const stored = element.dataset[DATASET_KEY];
        if (stored) {
          if (stored !== DATASET_NONE) {
            element.setAttribute('tabindex', stored);
          } else {
            element.removeAttribute('tabindex');
          }
          delete element.dataset[DATASET_KEY];
        }
        element.removeAttribute('aria-hidden');
      });
    };
  }, [
    supportsInert,
    isSidebarOpen,
    searchQuery,
    searchResults.length,
    pinnedFolders.length,
    pinnedPages.length,
  ]);

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

  // Check if all folders are expanded
  const allFoldersExpanded = useMemo(() => {
    const allFolderIds = allFolders.map(f => f.folder.id);
    return (
      allFolderIds.length > 0 &&
      allFolderIds.every(id => expandedFolders.has(id))
    );
  }, [allFolders, expandedFolders]);

  // Toggle between expand all and collapse all
  const handleToggleAll = useCallback(() => {
    if (allFoldersExpanded) {
      collapseAll();
    } else {
      handleExpandAll();
    }
  }, [allFoldersExpanded, collapseAll, handleExpandAll]);

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
      const target = event.target as HTMLElement | null;
      if (
        sidebarRef.current &&
        target &&
        !sidebarRef.current.contains(target)
      ) {
        return;
      }

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
    sidebarRef,
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
      <button
        key={item.id}
        type="button"
        className={`${styles['sidebar-item']} ${isActive ? styles['sidebar-item--active'] : ''} ${isPinned && showPin ? styles['sidebar-item--pinned'] : ''}`}
        onClick={() => handleNavigate(item)}
        onContextMenu={e => handleContextMenu(e, item)}
        aria-current={isActive ? 'page' : undefined}
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
      </button>
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
      <button
        key={`${result.type}-${result.id}`}
        type="button"
        className={`${styles['search-result']} ${isSelected ? styles['search-result--selected'] : ''}`}
        onClick={() => handleSearchResultSelect(result)}
        aria-selected={isSelected}
      >
        <div className={styles['search-result-label']}>{label}</div>
        <div className={styles['search-result-meta']}>{meta}</div>
      </button>
    );
  };

  return (
    <div
      id="app-sidebar"
      ref={sidebarRef}
      className={`${styles.sidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}
      style={{
        width: isMobile ? undefined : sidebarWidth,
      }}
      aria-hidden={!isSidebarOpen}
      {...(supportsInert && !isSidebarOpen && { inert: true })}
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
          aria-label="LUM.BIO, Go to home"
        >
          LUM.BIO
        </button>
        <div className={styles['header-controls']}>
          <Tooltip
            content={
              allFoldersExpanded ? 'Collapse all folders' : 'Expand all folders'
            }
            position="bottom"
          >
            <button
              className={`${styles['control-button']} ${allFoldersExpanded ? styles['control-button--active'] : ''}`}
              onClick={handleToggleAll}
              aria-label={
                allFoldersExpanded
                  ? 'Collapse all folders'
                  : 'Expand all folders'
              }
            >
              {allFoldersExpanded ? (
                <ChevronsUp size={16} />
              ) : (
                <ChevronsDown size={16} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      <div className={styles['search-container']}>
        <Search size={16} className={styles['search-icon']} />
        <input
          type="text"
          placeholder="Filter sidebar..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles['search-input']}
          aria-label="Filter sidebar items"
          aria-describedby="sidebar-filter-help"
        />
        {searchQuery && (
          <button
            className={styles['search-clear']}
            onClick={() => setSearchQuery('')}
            aria-label="Clear filter"
          >
            <X size={16} />
          </button>
        )}
        <span id="sidebar-filter-help" className={styles['sr-only']}>
          Type to filter sidebar navigation. Use global search (top right) to
          search all content.
        </span>
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
          const safeUrl = getSafeUrl(social.url);

          if (!safeUrl) {
            return (
              <button
                key={social.code}
                type="button"
                className={`${styles['social-link']} ${styles['social-link--disabled']}`}
                disabled
                aria-disabled="true"
                aria-label={`${social.name} unavailable`}
              >
                {social.code}
              </button>
            );
          }

          const ariaLabelParts = [`${social.code}, Open ${social.name}`];
          if (safeUrl.isMailto) {
            ariaLabelParts.push('(opens email client)');
          }
          if (safeUrl.isExternal) {
            ariaLabelParts.push('(opens in new tab)');
          }

          return (
            <a
              key={social.code}
              href={safeUrl.href}
              className={styles['social-link']}
              target={safeUrl.isExternal ? '_blank' : undefined}
              rel={safeUrl.isExternal ? 'noopener noreferrer' : undefined}
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
