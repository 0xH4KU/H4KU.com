import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSearchExecutor } from '@/contexts/SearchContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useDebounce } from '@/hooks/useDebounce';
import { useSidebarKeyboardNavigation } from '@/hooks/useSidebarKeyboardNavigation';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult } from '@/types';
import { DEBOUNCE_DELAYS, SIDEBAR_CONFIG } from '@/config/constants';
import { buildAppUrl, buildFolderUrl, buildPageUrl } from '@/utils/urlHelpers';
import { navigateFromSearchResult } from '@/utils/searchNavigation';
import { ContextMenu } from './ContextMenu';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarFilter } from './SidebarFilter';
import { SidebarSearchResults } from './SidebarSearchResults';
import { SidebarSections } from './SidebarSections';
import styles from './Sidebar.module.css';

const KEYBOARD_RESIZE_STEP = 16;
const KEYBOARD_RESIZE_FAST_STEP = 48;
const clampSidebarWidth = (value: number) =>
  Math.min(Math.max(value, SIDEBAR_CONFIG.MIN_WIDTH), SIDEBAR_CONFIG.MAX_WIDTH);

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
  const { openLightbox } = useLightbox();
  const { runSearch } = useSearchExecutor();
  const { activePath, navigateTo, resetToHome, allFolders } = useNavigation();
  const { width } = useWindowSize();
  const { folders, pages, socials } = mockData;
  const isMobile =
    width !== undefined && width < SIDEBAR_CONFIG.MOBILE_BREAKPOINT;
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragWidthRef = useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: SidebarEntry;
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const debouncedSidebarQuery = useDebounce(
    sidebarQuery,
    DEBOUNCE_DELAYS.SEARCH
  );
  const sidebarResults = useMemo(
    () => runSearch(debouncedSidebarQuery),
    [runSearch, debouncedSidebarQuery]
  );
  const supportsInert = useMemo(() => hasInertSupport(), []);
  const normalizedSidebarWidth = clampSidebarWidth(sidebarWidth);

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
      if (item.type === 'folder') {
        const flatFolder = allFolders.find(flat => flat.folder.id === item.id);
        if (!flatFolder) {
          return buildAppUrl('/');
        }
        return buildFolderUrl(flatFolder.path);
      }

      if (item.type === 'txt') {
        return buildPageUrl(item.id);
      }

      return buildAppUrl('/');
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

  const allVisibleItems = useMemo(
    () => [
      ...pinnedFolders,
      ...unpinnedFolders,
      ...pinnedPages,
      ...unpinnedPages,
    ],
    [pinnedFolders, unpinnedFolders, pinnedPages, unpinnedPages]
  );

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

  const applySidebarWidth = useCallback(
    (nextWidth: number) => {
      setSidebarWidth(clampSidebarWidth(nextWidth));
    },
    [setSidebarWidth]
  );

  const flushDragWidth = useCallback(() => {
    if (pendingDragWidthRef.current === null) {
      return;
    }
    applySidebarWidth(pendingDragWidthRef.current);
    pendingDragWidthRef.current = null;
  }, [applySidebarWidth]);

  const scheduleDragUpdate = useCallback(
    (nextWidth: number) => {
      pendingDragWidthRef.current = nextWidth;
      if (typeof window === 'undefined') {
        flushDragWidth();
        return;
      }

      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        flushDragWidth();
        dragFrameRef.current = null;
      });
    },
    [flushDragWidth]
  );

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const handled = navigateFromSearchResult(result, {
        navigateTo,
        openLightbox,
      });
      if (handled && isMobile) {
        closeSidebar();
      }
    },
    [navigateTo, openLightbox, isMobile, closeSidebar]
  );

  const handleDragStart = (
    event: React.MouseEvent | React.TouchEvent | React.PointerEvent
  ) => {
    event.preventDefault();
    setIsDragging(true);
    resizeHandleRef.current?.focus();
  };

  // Handle sidebar resize
  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      scheduleDragUpdate(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!event.touches.length) {
        return;
      }
      const touch = event.touches[0];
      scheduleDragUpdate(touch.clientX);
    };

    const stopDrag = () => {
      setIsDragging(false);
      flushDragWidth();
      if (dragFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', handleTouchMove, {
      passive: true,
    });
    document.addEventListener('touchend', stopDrag, { passive: true });
    document.addEventListener('touchcancel', stopDrag, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopDrag);
      document.removeEventListener('touchcancel', stopDrag);
      if (dragFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };
  }, [flushDragWidth, isDragging, scheduleDragUpdate]);

  const handleResizeHandleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const baseStep = event.shiftKey
        ? KEYBOARD_RESIZE_FAST_STEP
        : KEYBOARD_RESIZE_STEP;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault();
          applySidebarWidth(normalizedSidebarWidth - baseStep);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault();
          applySidebarWidth(normalizedSidebarWidth + baseStep);
          break;
        case 'Home':
          event.preventDefault();
          applySidebarWidth(SIDEBAR_CONFIG.MIN_WIDTH);
          break;
        case 'End':
          event.preventDefault();
          applySidebarWidth(SIDEBAR_CONFIG.MAX_WIDTH);
          break;
      }
    },
    [applySidebarWidth, normalizedSidebarWidth]
  );

  useEffect(() => {
    if (supportsInert || !sidebarRef.current) {
      return;
    }

    const container = sidebarRef.current;

    const updateFocusableElements = (disable: boolean) => {
      const focusableElements =
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      focusableElements.forEach(element => {
        if (disable) {
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
    };

    updateFocusableElements(!isSidebarOpen);

    let observer: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        updateFocusableElements(!isSidebarOpen);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer?.disconnect();
      updateFocusableElements(false);
    };
  }, [supportsInert, isSidebarOpen]);

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

  useSidebarKeyboardNavigation({
    isSidebarOpen,
    sidebarQuery,
    sidebarResults,
    allVisibleItems,
    focusedIndex,
    setFocusedIndex,
    handleSearchResultSelect,
    handleNavigate,
    sidebarElement: sidebarRef.current,
  });

  return (
    <nav
      id="app-sidebar"
      ref={sidebarRef}
      className={`${styles.sidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}
      style={{
        width: isMobile ? undefined : normalizedSidebarWidth,
      }}
      aria-hidden={!isSidebarOpen}
      {...(supportsInert && !isSidebarOpen && { inert: true })}
    >
      <SidebarHeader
        allFoldersExpanded={allFoldersExpanded}
        onToggleAll={handleToggleAll}
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
            onSelect={handleSearchResultSelect}
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
            onToggleFolder={toggleFolder}
            onNavigate={handleNavigate}
            onContextMenu={handleContextMenu}
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
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onKeyDown={handleResizeHandleKeyDown}
      />

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
    </nav>
  );
};

export default Sidebar;
