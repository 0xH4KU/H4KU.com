import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { mockData } from '@/data/mockData';
import { Folder, Page, ViewType } from '@/types';
import {
  findFolderById,
  findFolderByPath,
  findFolderPathById,
  flattenFolders,
  buildNavigationMap,
  type NavigationMap,
} from '@/utils/navigation';
import {
  useHistoryNavigation,
  getCurrentPath,
} from '@/hooks/useHistoryNavigation';

// Build navigation map once at module level for initial state parsing
const initialNavMap = buildNavigationMap(mockData.folders);

const getRouteSegments = (targetPath: string) => {
  const normalized = targetPath && targetPath !== '' ? targetPath : '/';
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) {
    return segments;
  }
  // Drop any leading prefix (e.g., BASE_URL) before the app route segments
  const firstRouteIndex = segments.findIndex(
    segment => segment === 'page' || segment === 'folder'
  );
  return firstRouteIndex > 0 ? segments.slice(firstRouteIndex) : segments;
};

/**
 * Parse pathname synchronously - used for initial state to avoid flash of wrong content.
 * This runs at module load time and during initial render.
 */
function parsePathnameSync(
  targetPath: string,
  navMap: NavigationMap
): { path: string[]; view: ViewType | null } {
  const segments = getRouteSegments(targetPath);

  if (segments.length === 0) {
    return { path: ['home'], view: null };
  }

  if (segments[0] === 'page' && segments[1]) {
    const page = mockData.pages.find(p => p.id === segments[1]);
    if (page) {
      return {
        path: ['home', page.id],
        view: { type: 'txt', data: page } as ViewType,
      };
    }
    return { path: ['home'], view: null };
  }

  if (segments[0] === 'folder') {
    const folderIds = segments.slice(1);
    if (folderIds.length) {
      const folder = findFolderByPath(mockData.folders, folderIds, navMap);
      if (folder) {
        return {
          path: ['home', ...folderIds],
          view: { type: 'folder', data: folder } as ViewType,
        };
      }
    }
  }

  return { path: ['home'], view: null };
}

/**
 * Get initial navigation state from URL synchronously.
 * Called during useState initialization to prevent flash of home page.
 */
function getInitialState(): { path: string[]; view: ViewType | null } {
  const pathname = getCurrentPath();
  return parsePathnameSync(pathname, initialNavMap);
}

// Compute initial state once at module level
const computedInitialState = getInitialState();

interface NavigationContextValue {
  currentPath: string[];
  currentView: ViewType | null;
  allFolders: ReturnType<typeof flattenFolders>;
  breadcrumbSegments: Array<{ id: string; label: string }>;
  activePath: string;
  navigateTo: (item: Folder | Page, pathOverride?: string[]) => void;
  navigateBack: () => void;
  resetToHome: () => void;
  handleBreadcrumbSelect: (id: string, index: number) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { pathname, navigate: updateHistory } = useHistoryNavigation();
  // Initialize state synchronously from URL to prevent flash of home page
  const [currentPath, setCurrentPath] = useState<string[]>(
    computedInitialState.path
  );
  const [currentView, setCurrentView] = useState<ViewType | null>(
    computedInitialState.view
  );
  const pendingHistoryPathRef = useRef<string | null>(null);
  const currentPathRef = useRef(currentPath);
  const currentViewRef = useRef<ViewType | null>(currentView);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Build navigation map once for O(1) lookups
  const navMap = useMemo<NavigationMap>(
    () => buildNavigationMap(mockData.folders),
    []
  );

  const allFolders = useMemo(() => navMap.flattened, [navMap]);

  const breadcrumbSegments = useMemo(
    () =>
      currentPath.map((segment, index) => {
        if (index === 0) {
          return { id: segment, label: 'home' };
        }
        // O(1) lookup using navigation map
        const folder = findFolderById(mockData.folders, segment, navMap);
        if (folder) {
          return { id: segment, label: folder.name };
        }
        const page = mockData.pages.find(item => item.id === segment);
        if (page) {
          return { id: segment, label: page.name };
        }
        return { id: segment, label: segment };
      }),
    [currentPath, navMap]
  );

  const activePath = useMemo(() => currentPath.join('/'), [currentPath]);

  const parsePathname = useCallback(
    (targetPath: string) => {
      const segments = getRouteSegments(targetPath);

      if (segments.length === 0) {
        return { path: ['home'], view: null };
      }

      if (segments[0] === 'page' && segments[1]) {
        const page = mockData.pages.find(p => p.id === segments[1]);
        if (page) {
          return {
            path: ['home', page.id],
            view: { type: 'txt', data: page } as ViewType,
          };
        }
        return { path: ['home'], view: null };
      }

      if (segments[0] === 'folder') {
        const folderIds = segments.slice(1);
        if (folderIds.length) {
          const folder = findFolderByPath(mockData.folders, folderIds, navMap);
          if (folder) {
            return {
              path: ['home', ...folderIds],
              view: { type: 'folder', data: folder } as ViewType,
            };
          }
        }
      }

      return { path: ['home'], view: null };
    },
    [navMap]
  );

  // Effect #1: Parse URL and update app state (for browser navigation)
  useEffect(() => {
    if (pendingHistoryPathRef.current === pathname) {
      pendingHistoryPathRef.current = null;
      return;
    }

    const { path: nextPath, view: nextView } = parsePathname(pathname);
    const pathsMatch =
      currentPathRef.current.length === nextPath.length &&
      currentPathRef.current.every(
        (segment, index) => segment === nextPath[index]
      );
    if (!pathsMatch) {
      setCurrentPath(nextPath);
    }

    const viewsMatch =
      (currentViewRef.current === null && nextView === null) ||
      (currentViewRef.current?.type === nextView?.type &&
        currentViewRef.current?.data === nextView?.data);
    if (!viewsMatch) {
      setCurrentView(nextView);
    }
  }, [pathname, parsePathname]);

  // Effect #2: Sync app state back to URL
  useEffect(() => {
    let targetPath = '/';

    if (currentPath.length > 1) {
      const lastSegment = currentPath[currentPath.length - 1];
      const page = mockData.pages.find(p => p.id === lastSegment);

      if (page) {
        targetPath = `/page/${page.id}`;
      } else {
        const folderPath = currentPath.slice(1).join('/');
        targetPath = `/folder/${folderPath}`;
      }
    }

    if (pathname === targetPath) {
      return;
    }

    pendingHistoryPathRef.current = targetPath;
    updateHistory(targetPath, { replace: true });
  }, [currentPath, pathname, updateHistory]);

  const openFolder = (folder: Folder, pathOverride?: string[]) => {
    // O(1) lookup using navigation map
    const resolvedPath =
      pathOverride ?? findFolderPathById(mockData.folders, folder.id, navMap);
    if (!resolvedPath || resolvedPath.length === 0) {
      return;
    }
    const canonicalFolder =
      findFolderByPath(mockData.folders, resolvedPath, navMap) ?? folder;
    setCurrentPath(['home', ...resolvedPath]);
    setCurrentView({ type: 'folder', data: canonicalFolder });
  };

  const normalizePath = (pathOverride?: string[]) => {
    if (!pathOverride || pathOverride.length === 0) {
      return ['home'];
    }
    return pathOverride[0] === 'home'
      ? [...pathOverride]
      : ['home', ...pathOverride];
  };

  const openPage = (page: Page, pathOverride?: string[]) => {
    const basePath = normalizePath(pathOverride);
    const nextPath = [...basePath, page.id];
    setCurrentPath(nextPath);
    setCurrentView({ type: 'txt', data: page });
  };

  const navigateTo = (item: Folder | Page, pathOverride?: string[]) => {
    if (item.type === 'folder') {
      openFolder(item, pathOverride);
    } else if (item.type === 'txt') {
      openPage(item, pathOverride);
    }
  };

  const navigateBack = () => {
    if (currentPath.length <= 1) {
      return;
    }

    const nextPath = currentPath.slice(0, -1);

    if (nextPath.length <= 1) {
      resetToHome();
      return;
    }

    const targetId = nextPath[nextPath.length - 1];
    // O(1) lookup using navigation map
    const folder = findFolderById(mockData.folders, targetId, navMap);
    if (folder) {
      openFolder(folder, nextPath.slice(1));
      return;
    }

    const page = mockData.pages.find(item => item.id === targetId);
    if (page) {
      openPage(page, nextPath.slice(0, -1));
      return;
    }

    resetToHome();
  };

  const resetToHome = () => {
    setCurrentPath(['home']);
    setCurrentView(null);
  };

  const handleBreadcrumbSelect = (id: string, index: number) => {
    if (index === 0) {
      resetToHome();
      return;
    }

    const targetPath = currentPath.slice(0, index + 1);
    const targetId = targetPath[targetPath.length - 1];

    // O(1) lookup using navigation map
    const folder = findFolderById(mockData.folders, targetId, navMap);
    if (folder) {
      openFolder(folder, targetPath.slice(1));
      return;
    }

    const page = mockData.pages.find(item => item.id === targetId);
    if (page) {
      openPage(page, targetPath.slice(0, -1));
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        currentView,
        allFolders,
        breadcrumbSegments,
        activePath,
        navigateTo,
        navigateBack,
        resetToHome,
        handleBreadcrumbSelect,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
