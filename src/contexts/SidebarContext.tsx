import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  DEBOUNCE_DELAYS,
  SIDEBAR_CONFIG,
  STORAGE_KEYS,
} from '@/config/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  expandAll: (folderIds: string[]) => void;
  collapseAll: () => void;
  pinnedItems: Set<string>;
  togglePin: (itemId: string) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const clampSidebarWidthValue = (value: number) => {
  const numeric =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : SIDEBAR_CONFIG.DEFAULT_WIDTH;
  return Math.min(
    Math.max(numeric, SIDEBAR_CONFIG.MIN_WIDTH),
    SIDEBAR_CONFIG.MAX_WIDTH
  );
};

const getInitialSidebarState = () => {
  /* istanbul ignore next */
  if (typeof window === 'undefined') {
    return true;
  }
  return window.innerWidth >= SIDEBAR_CONFIG.MOBILE_BREAKPOINT;
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
  const [storedSidebarWidth, setStoredSidebarWidth] = useLocalStorage<number>(
    STORAGE_KEYS.SIDEBAR_WIDTH,
    SIDEBAR_CONFIG.DEFAULT_WIDTH,
    {
      sanitize: (value, fallback) => {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return fallback;
        }
        return clampSidebarWidthValue(value);
      },
    }
  );
  const [sidebarWidth, setSidebarWidthState] = useState(() =>
    clampSidebarWidthValue(storedSidebarWidth)
  );
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.EXPANDED_FOLDERS,
    []
  );
  const [pinnedItemIds, setPinnedItemIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.PINNED_ITEMS,
    []
  );

  const expandedFolders = useMemo(
    () => new Set(expandedFolderIds),
    [expandedFolderIds]
  );
  const pinnedItems = useMemo(() => new Set(pinnedItemIds), [pinnedItemIds]);

  const normalizedSidebarWidth = clampSidebarWidthValue(sidebarWidth);

  useEffect(() => {
    setSidebarWidthState(clampSidebarWidthValue(storedSidebarWidth));
  }, [storedSidebarWidth]);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const flushPendingPersist = useCallback(() => {
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = null;
      setStoredSidebarWidth(sidebarWidthRef.current);
    }
  }, [setStoredSidebarWidth]);

  const schedulePersist = useCallback(
    (value: number) => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      persistTimeoutRef.current = setTimeout(() => {
        setStoredSidebarWidth(value);
        persistTimeoutRef.current = null;
      }, DEBOUNCE_DELAYS.RESIZE);
    },
    [setStoredSidebarWidth]
  );

  useEffect(
    () => () => {
      flushPendingPersist();
    },
    [flushPendingPersist]
  );

  const setSidebarWidth = useCallback(
    (nextWidth: number) => {
      const clamped = clampSidebarWidthValue(nextWidth);
      setSidebarWidthState(prev => (prev === clamped ? prev : clamped));
      schedulePersist(clamped);
    },
    [schedulePersist]
  );

  const updateExpandedFolders = useCallback(
    (updater: (current: Set<string>) => void) => {
      setExpandedFolderIds(prev => {
        const next = new Set(prev);
        updater(next);
        return Array.from(next);
      });
    },
    [setExpandedFolderIds]
  );

  useEffect(() => {
    /* istanbul ignore next */
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(
      `(min-width: ${SIDEBAR_CONFIG.MOBILE_BREAKPOINT}px)`
    );
    setSidebarOpen(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleFolder = useCallback(
    (folderId: string) => {
      updateExpandedFolders(next => {
        if (next.has(folderId)) {
          next.delete(folderId);
        } else {
          next.add(folderId);
        }
      });
    },
    [updateExpandedFolders]
  );

  const expandFolder = useCallback(
    (folderId: string) => {
      updateExpandedFolders(next => {
        next.add(folderId);
      });
    },
    [updateExpandedFolders]
  );

  const collapseFolder = useCallback(
    (folderId: string) => {
      updateExpandedFolders(next => {
        next.delete(folderId);
      });
    },
    [updateExpandedFolders]
  );

  const expandAll = useCallback(
    (folderIds: string[]) => {
      setExpandedFolderIds(folderIds);
    },
    [setExpandedFolderIds]
  );

  const collapseAll = useCallback(() => {
    setExpandedFolderIds([]);
  }, [setExpandedFolderIds]);

  const togglePin = useCallback(
    (itemId: string) => {
      setPinnedItemIds(prev => {
        const set = new Set(prev);
        if (set.has(itemId)) {
          set.delete(itemId);
        } else {
          set.add(itemId);
        }
        return Array.from(set);
      });
    },
    [setPinnedItemIds]
  );

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        expandedFolders,
        toggleFolder,
        expandFolder,
        collapseFolder,
        expandAll,
        collapseAll,
        pinnedItems,
        togglePin,
        sidebarWidth: normalizedSidebarWidth,
        setSidebarWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};
