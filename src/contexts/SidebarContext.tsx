import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { SIDEBAR_CONFIG, STORAGE_KEYS } from '@/config/constants';
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
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.innerWidth >= SIDEBAR_CONFIG.MOBILE_BREAKPOINT;
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
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

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
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
