import React, { useEffect, useMemo, useState } from 'react';
import {
  ContentView,
  Crosshair,
  Lightbox,
  Sidebar,
  StatusBar,
  TopBar,
  SearchPanel,
} from '@/components';
import GlobalStyles from '@/styles/GlobalStyles';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult, ViewType, WorkItem } from '@/types';
import { findFolderById, findFolderByPath, findFolderPathById, flattenFolders } from '@/utils/navigation';

type Theme = 'light' | 'dark';

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 320;
const THEME_STORAGE_KEY = 'lum.bio.theme';

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
};

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getPreferredTheme());
  const [hasStoredTheme, setHasStoredTheme] = useState<boolean>(() => getStoredTheme() !== null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const sidebarCollapsed = false;
  const [currentPath, setCurrentPath] = useState<string[]>(['home']);
  const [currentView, setCurrentView] = useState<ViewType | null>(null);
  const [lightboxImage, setLightboxImage] = useState<WorkItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
      return next;
    });
    setHasStoredTheme(true);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !lightboxImage && !searchOpen) {
        setShowCrosshair((prev) => !prev);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage, searchOpen]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setSidebarWidth((current) => {
        const clamped = Math.min(Math.max(event.clientX, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
        return current === clamped ? current : clamped;
      });
    };

    const stopDrag = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [isDragging]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (hasStoredTheme || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasStoredTheme]);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const openFolder = (folder: Folder, pathOverride?: string[]) => {
    const resolvedPath = pathOverride ?? findFolderPathById(mockData.folders, folder.id);
    if (!resolvedPath || resolvedPath.length === 0) {
      return;
    }
    const canonicalFolder = findFolderByPath(mockData.folders, resolvedPath) ?? folder;
    setCurrentPath(['home', ...resolvedPath]);
    setCurrentView({ type: 'folder', data: canonicalFolder });
  };

  const openPage = (page: Page) => {
    setCurrentPath(['home', page.id]);
    setCurrentView({ type: 'txt', data: page });
  };

  const navigateTo = (item: Folder | Page, pathOverride?: string[]) => {
    if (item.type === 'folder') {
      openFolder(item, pathOverride);
    } else if (item.type === 'txt') {
      openPage(item);
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
    const folder = findFolderById(mockData.folders, targetId);
    if (folder) {
      openFolder(folder, nextPath.slice(1));
      return;
    }

    const page = mockData.pages.find((item) => item.id === targetId);
    if (page) {
      openPage(page);
      return;
    }

    resetToHome();
  };

  const resetToHome = () => {
    setCurrentPath(['home']);
    setCurrentView(null);
  };

  const handleLightboxClose = () => setLightboxImage(null);

  const allFolders = useMemo(() => flattenFolders(mockData.folders), []);

  const breadcrumbSegments = useMemo(
    () =>
      currentPath.map((segment, index) => {
        if (index === 0) {
          return { id: segment, label: 'home' };
        }
        const folder = findFolderById(mockData.folders, segment);
        if (folder) {
          return { id: segment, label: folder.name };
        }
        const page = mockData.pages.find((item) => item.id === segment);
        return { id: segment, label: page ? page.name : segment };
      }),
    [currentPath],
  );

  const activePath = useMemo(() => currentPath.slice(1), [currentPath]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const folderMatches: SearchResult[] = allFolders
      .filter(({ folder }) => folder.name.toLowerCase().includes(query) || folder.id.toLowerCase().includes(query))
      .map(({ folder, path }) => ({
        type: 'folder' as const,
        id: folder.id,
        label: folder.name,
        path,
        folder,
      }));

    const pageMatches: SearchResult[] = mockData.pages
      .filter((page) => page.name.toLowerCase().includes(query) || page.content.toLowerCase().includes(query))
      .map((page) => ({
        type: 'page' as const,
        id: page.id,
        label: page.name,
        page,
      }));

    const workMatches: SearchResult[] = allFolders
      .flatMap(({ folder, path }) =>
        (folder.items ?? []).map<SearchResult>((work) => ({
          type: 'work' as const,
          id: work.id,
          label: work.filename,
          path,
          folder,
          work,
        })),
      )
      .filter(
        (workResult) =>
          workResult.label.toLowerCase().includes(query) ||
          workResult.work.date.toLowerCase().includes(query) ||
          workResult.work.dimensions.toLowerCase().includes(query),
      );

    return [...folderMatches, ...pageMatches, ...workMatches].slice(0, 30);
  }, [allFolders, searchQuery]);

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'folder') {
      navigateTo(result.folder, result.path);
    } else if (result.type === 'page') {
      navigateTo(result.page);
    } else if (result.type === 'work') {
      const folder = result.folder;
      if (folder) {
        navigateTo(folder, result.path);
        const workItem = folder.items?.find((item) => item.id === result.work.id);
        if (workItem) {
          setLightboxImage(workItem);
        }
      }
    }
    setSearchOpen(false);
  };

  const handleBreadcrumbSelect = (index: number) => {
    if (index === currentPath.length - 1) {
      return;
    }

    if (index === 0) {
      resetToHome();
      return;
    }

    const targetId = currentPath[index];
    const pathSlice = currentPath.slice(1, index + 1);
    const folder = findFolderById(mockData.folders, targetId);
    if (folder) {
      openFolder(folder, pathSlice);
      return;
    }

    const page = mockData.pages.find((item) => item.id === targetId);
    if (page) {
      openPage(page);
    }
  };

  return (
    <div className={`app ${theme}`}>
      <GlobalStyles />
      <Crosshair show={showCrosshair} mousePos={mousePos} />
      <TopBar
        pathSegments={breadcrumbSegments}
        canGoBack={currentPath.length > 1}
        onBack={navigateBack}
        onToggleSearch={() => setSearchOpen((prev) => !prev)}
        onToggleTheme={toggleTheme}
        theme={theme}
        isSearchOpen={searchOpen}
        onSelectPath={handleBreadcrumbSelect}
      />
      <div className="main-layout">
        <Sidebar
          width={sidebarWidth}
          collapsed={sidebarCollapsed}
          folders={mockData.folders}
          pages={mockData.pages}
          socials={mockData.socials}
          onNavigate={navigateTo}
          onDragStart={() => setIsDragging(true)}
          activePath={activePath}
        />
        <div className="content-area">
          <ContentView
            currentView={currentView}
            data={mockData}
            onNavigate={navigateTo}
            onOpenLightbox={(item) => setLightboxImage(item)}
            onCloseTextView={resetToHome}
            theme={theme}
          />
        </div>
      </div>
      <StatusBar
        socials={mockData.socials}
        itemCount={mockData.folders.length + mockData.pages.length}
      />
      <Lightbox image={lightboxImage} onClose={handleLightboxClose} />
      <SearchPanel
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        onSelect={handleSearchSelect}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

export default App;
