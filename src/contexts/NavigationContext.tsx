import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { mockData } from '@/data/mockData';
import { Folder, Page, ViewType, WorkItem } from '@/types';
import {
  findFolderById,
  findFolderByPath,
  findFolderPathById,
  flattenFolders,
} from '@/utils/navigation';

interface NavigationContextValue {
  currentPath: string[];
  currentView: ViewType | null;
  lightboxImage: WorkItem | null;
  allFolders: ReturnType<typeof flattenFolders>;
  breadcrumbSegments: Array<{ id: string; label: string }>;
  activePath: string;
  navigateTo: (item: Folder | Page, pathOverride?: string[]) => void;
  navigateBack: () => void;
  resetToHome: () => void;
  handleBreadcrumbSelect: (id: string, index: number) => void;
  openLightbox: (image: WorkItem) => void;
  closeLightbox: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string[]>(['home']);
  const [currentView, setCurrentView] = useState<ViewType | null>(null);
  const [lightboxImage, setLightboxImage] = useState<WorkItem | null>(null);

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
        const page = mockData.pages.find(item => item.id === segment);
        if (page) {
          return { id: segment, label: page.name };
        }
        return { id: segment, label: segment };
      }),
    [currentPath]
  );

  const activePath = useMemo(() => currentPath.join('/'), [currentPath]);

  const openFolder = (folder: Folder, pathOverride?: string[]) => {
    const resolvedPath =
      pathOverride ?? findFolderPathById(mockData.folders, folder.id);
    if (!resolvedPath || resolvedPath.length === 0) {
      return;
    }
    const canonicalFolder =
      findFolderByPath(mockData.folders, resolvedPath) ?? folder;
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

    const page = mockData.pages.find(item => item.id === targetId);
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

  const handleBreadcrumbSelect = (id: string, index: number) => {
    if (index === 0) {
      resetToHome();
      return;
    }

    const targetPath = currentPath.slice(0, index + 1);
    const targetId = targetPath[targetPath.length - 1];

    const folder = findFolderById(mockData.folders, targetId);
    if (folder) {
      openFolder(folder, targetPath.slice(1));
      return;
    }

    const page = mockData.pages.find(item => item.id === targetId);
    if (page) {
      openPage(page);
    }
  };

  const openLightbox = (image: WorkItem) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        currentView,
        lightboxImage,
        allFolders,
        breadcrumbSegments,
        activePath,
        navigateTo,
        navigateBack,
        resetToHome,
        handleBreadcrumbSelect,
        openLightbox,
        closeLightbox,
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
