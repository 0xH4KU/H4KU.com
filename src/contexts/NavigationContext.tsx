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

const CONTACT_VERIFY_PAGE_ID = 'contact-verify';

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

  if (segments[0] === 'contact' && segments[1] === 'verify') {
    const verifyPage = mockData.pages.find(
      page => page.id === CONTACT_VERIFY_PAGE_ID
    );
    if (verifyPage) {
      return {
        path: ['home', CONTACT_VERIFY_PAGE_ID],
        view: { type: 'txt', data: verifyPage } as ViewType,
      };
    }
  }

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

/**
 * Navigation state combining path and view to avoid out-of-sync issues
 */
interface NavigationState {
  path: string[];
  view: ViewType | null;
}

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

/** Navigation update source to prevent circular updates */
type UpdateSource = 'browser' | 'app';

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { pathname, navigate: updateHistory } = useHistoryNavigation();

  // Single source of truth for navigation state
  const [navState, setNavState] = useState<NavigationState>({
    path: computedInitialState.path,
    view: computedInitialState.view,
  });

  // Track the source of the last update to prevent circular effects
  const lastUpdateSourceRef = useRef<UpdateSource>('browser');
  // Track the last pathname we pushed to history
  const lastPushedPathnameRef = useRef<string | null>(null);

  // Build navigation map once for O(1) lookups
  const navMap = useMemo<NavigationMap>(
    () => buildNavigationMap(mockData.folders),
    []
  );

  const allFolders = useMemo(() => navMap.flattened, [navMap]);

  const breadcrumbSegments = useMemo(
    () =>
      navState.path.map((segment, index) => {
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
    [navState.path, navMap]
  );

  const activePath = useMemo(() => navState.path.join('/'), [navState.path]);

  const parsePathname = useCallback(
    (targetPath: string): NavigationState => {
      const segments = getRouteSegments(targetPath);

      if (segments[0] === 'contact' && segments[1] === 'verify') {
        const verifyPage = mockData.pages.find(
          page => page.id === CONTACT_VERIFY_PAGE_ID
        );
        if (verifyPage) {
          return {
            path: ['home', CONTACT_VERIFY_PAGE_ID],
            view: { type: 'txt', data: verifyPage } as ViewType,
          };
        }
      }

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

  // Convert current state to URL pathname
  const stateToPathname = useCallback((state: NavigationState): string => {
    if (state.path.length <= 1) {
      return '/';
    }

    const lastSegment = state.path[state.path.length - 1];

    if (lastSegment === CONTACT_VERIFY_PAGE_ID) {
      return '/contact/verify';
    }

    const page = mockData.pages.find(p => p.id === lastSegment);

    if (page) {
      return `/page/${page.id}`;
    }

    const folderPath = state.path.slice(1).join('/');
    return `/folder/${folderPath}`;
  }, []);

  // Effect: Handle browser navigation (back/forward)
  useEffect(() => {
    // Skip if this pathname change was caused by our own push
    if (lastPushedPathnameRef.current === pathname) {
      lastPushedPathnameRef.current = null;
      return;
    }

    // Browser navigation occurred - update state
    const nextState = parsePathname(pathname);

    setNavState(currentState => {
      const pathsMatch =
        currentState.path.length === nextState.path.length &&
        currentState.path.every(
          (segment, index) => segment === nextState.path[index]
        );

      const viewsMatch =
        (currentState.view === null && nextState.view === null) ||
        (currentState.view?.type === nextState.view?.type &&
          currentState.view?.data === nextState.view?.data);

      if (pathsMatch && viewsMatch) {
        return currentState;
      }

      lastUpdateSourceRef.current = 'browser';
      return nextState;
    });
  }, [pathname, parsePathname]);

  // Effect: Sync app-initiated state changes to URL
  useEffect(() => {
    // Only sync if the last update was from the app (not browser navigation)
    if (lastUpdateSourceRef.current !== 'app') {
      return;
    }

    const targetPath = stateToPathname(navState);

    if (pathname === targetPath) {
      return;
    }

    lastPushedPathnameRef.current = targetPath;
    updateHistory(targetPath, { replace: true });
  }, [navState, pathname, stateToPathname, updateHistory]);

  const updateNavState = useCallback((newState: NavigationState) => {
    lastUpdateSourceRef.current = 'app';
    setNavState(newState);
  }, []);

  const openFolder = useCallback(
    (folder: Folder, pathOverride?: string[]) => {
      // O(1) lookup using navigation map
      const resolvedPath =
        pathOverride ?? findFolderPathById(mockData.folders, folder.id, navMap);
      if (!resolvedPath || resolvedPath.length === 0) {
        return;
      }
      const canonicalFolder =
        findFolderByPath(mockData.folders, resolvedPath, navMap) ?? folder;
      updateNavState({
        path: ['home', ...resolvedPath],
        view: { type: 'folder', data: canonicalFolder },
      });
    },
    [navMap, updateNavState]
  );

  const normalizePath = useCallback((pathOverride?: string[]) => {
    if (!pathOverride || pathOverride.length === 0) {
      return ['home'];
    }
    return pathOverride[0] === 'home'
      ? [...pathOverride]
      : ['home', ...pathOverride];
  }, []);

  const openPage = useCallback(
    (page: Page, pathOverride?: string[]) => {
      const basePath = normalizePath(pathOverride);
      const nextPath = [...basePath, page.id];
      updateNavState({
        path: nextPath,
        view: { type: 'txt', data: page },
      });
    },
    [normalizePath, updateNavState]
  );

  const navigateTo = useCallback(
    (item: Folder | Page, pathOverride?: string[]) => {
      if (item.type === 'folder') {
        openFolder(item, pathOverride);
      } else if (item.type === 'txt') {
        openPage(item, pathOverride);
      }
    },
    [openFolder, openPage]
  );

  const resetToHome = useCallback(() => {
    updateNavState({ path: ['home'], view: null });
  }, [updateNavState]);

  const navigateBack = useCallback(() => {
    setNavState(currentState => {
      if (currentState.path.length <= 1) {
        return currentState;
      }

      const nextPath = currentState.path.slice(0, -1);

      if (nextPath.length <= 1) {
        lastUpdateSourceRef.current = 'app';
        return { path: ['home'], view: null };
      }

      const targetId = nextPath[nextPath.length - 1];
      // O(1) lookup using navigation map
      const folder = findFolderById(mockData.folders, targetId, navMap);
      if (folder) {
        const resolvedPath = nextPath.slice(1);
        const canonicalFolder =
          findFolderByPath(mockData.folders, resolvedPath, navMap) ?? folder;
        lastUpdateSourceRef.current = 'app';
        return {
          path: nextPath,
          view: { type: 'folder', data: canonicalFolder },
        };
      }

      const page = mockData.pages.find(item => item.id === targetId);
      if (page) {
        lastUpdateSourceRef.current = 'app';
        return {
          path: nextPath,
          view: { type: 'txt', data: page },
        };
      }

      lastUpdateSourceRef.current = 'app';
      return { path: ['home'], view: null };
    });
  }, [navMap]);

  const handleBreadcrumbSelect = useCallback(
    (id: string, index: number) => {
      if (index === 0) {
        resetToHome();
        return;
      }

      setNavState(currentState => {
        const targetPath = currentState.path.slice(0, index + 1);
        const targetId = targetPath[targetPath.length - 1];

        // O(1) lookup using navigation map
        const folder = findFolderById(mockData.folders, targetId, navMap);
        if (folder) {
          const resolvedPath = targetPath.slice(1);
          const canonicalFolder =
            findFolderByPath(mockData.folders, resolvedPath, navMap) ?? folder;
          lastUpdateSourceRef.current = 'app';
          return {
            path: targetPath,
            view: { type: 'folder', data: canonicalFolder },
          };
        }

        const page = mockData.pages.find(item => item.id === targetId);
        if (page) {
          lastUpdateSourceRef.current = 'app';
          return {
            path: targetPath,
            view: { type: 'txt', data: page },
          };
        }

        return currentState;
      });
    },
    [navMap, resetToHome]
  );

  const contextValue = useMemo(
    () => ({
      currentPath: navState.path,
      currentView: navState.view,
      allFolders,
      breadcrumbSegments,
      activePath,
      navigateTo,
      navigateBack,
      resetToHome,
      handleBreadcrumbSelect,
    }),
    [
      navState.path,
      navState.view,
      allFolders,
      breadcrumbSegments,
      activePath,
      navigateTo,
      navigateBack,
      resetToHome,
      handleBreadcrumbSelect,
    ]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
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
