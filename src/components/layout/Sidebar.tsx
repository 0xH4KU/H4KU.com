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
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { useInertFallback } from '@/hooks/useInertFallback';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult } from '@/types';
import { DEBOUNCE_DELAYS, SIDEBAR_CONFIG } from '@/config/constants';
import { buildAppUrl, buildFolderUrl, buildPageUrl } from '@/utils/urlHelpers';
import { navigateFromSearchResult } from '@/utils/searchNavigation';
import { SidebarView } from './SidebarView';
import type { SidebarEntry } from './Sidebar.types';

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
  const { folders, socials } = mockData;
  const pages = useMemo(() => mockData.pages.filter(page => !page.hidden), []);
  const isCompactViewport =
    width !== undefined && width <= SIDEBAR_CONFIG.MOBILE_BREAKPOINT;
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: SidebarEntry;
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const debouncedSidebarQuery = useDebounce(
    sidebarQuery,
    DEBOUNCE_DELAYS.SEARCH
  );
  const sidebarResults = useMemo(
    () => runSearch(debouncedSidebarQuery),
    [runSearch, debouncedSidebarQuery]
  );

  // Use extracted hooks for resize and inert fallback
  const {
    resizeHandleRef,
    normalizedWidth: normalizedSidebarWidth,
    handleDragStart,
    handleResizeKeyDown: handleResizeHandleKeyDown,
  } = useSidebarResize({ sidebarWidth, setSidebarWidth });

  const { inertProps } = useInertFallback({
    containerRef: sidebarRef,
    isInert: !isSidebarOpen,
  });

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
      if (isCompactViewport) {
        closeSidebar();
      }
    },
    [navigateTo, isCompactViewport, closeSidebar]
  );

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const handled = navigateFromSearchResult(result, {
        navigateTo,
        openLightbox,
      });
      if (handled && isCompactViewport) {
        closeSidebar();
      }
    },
    [navigateTo, openLightbox, isCompactViewport, closeSidebar]
  );

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
    <SidebarView
      isSidebarOpen={isSidebarOpen}
      isCompact={isCompactViewport}
      normalizedSidebarWidth={normalizedSidebarWidth}
      inertProps={inertProps}
      sidebarRef={sidebarRef}
      resetToHome={resetToHome}
      closeSidebar={closeSidebar}
      allFoldersExpanded={allFoldersExpanded}
      onToggleAll={handleToggleAll}
      sidebarQuery={sidebarQuery}
      setSidebarQuery={setSidebarQuery}
      sidebarResults={sidebarResults}
      focusedIndex={focusedIndex}
      onSearchResultSelect={handleSearchResultSelect}
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
      socials={socials}
      resizeHandleRef={resizeHandleRef}
      onResizeStart={handleDragStart}
      onResizeKeyDown={handleResizeHandleKeyDown}
      contextMenu={contextMenu}
      onCloseContextMenu={() => setContextMenu(null)}
      onTogglePin={id => togglePin(id)}
      onCopyLink={handleCopyLink}
      onOpenInNewTab={handleOpenInNewTab}
    />
  );
};

export default Sidebar;
