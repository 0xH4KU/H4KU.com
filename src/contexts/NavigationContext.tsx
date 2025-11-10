import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  lightboxGallery: WorkItem[];
  lightboxIndex: number;
  allFolders: ReturnType<typeof flattenFolders>;
  breadcrumbSegments: Array<{ id: string; label: string }>;
  activePath: string;
  navigateTo: (item: Folder | Page, pathOverride?: string[]) => void;
  navigateBack: () => void;
  resetToHome: () => void;
  handleBreadcrumbSelect: (id: string, index: number) => void;
  openLightbox: (image: WorkItem, gallery: WorkItem[]) => void;
  closeLightbox: () => void;
  navigateToNextImage: () => void;
  navigateToPrevImage: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState<string[]>(['home']);
  const [currentView, setCurrentView] = useState<ViewType | null>(null);
  const [lightboxImage, setLightboxImage] = useState<WorkItem | null>(null);
  const [lightboxGallery, setLightboxGallery] = useState<WorkItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize from URL on mount
  useEffect(() => {
    if (isInitialized) return;

    const pathFromUrl = location.pathname;
    if (pathFromUrl === '/' || pathFromUrl === '') {
      setIsInitialized(true);
      return;
    }

    const segments = pathFromUrl.split('/').filter(Boolean);

    if (segments.length === 0) {
      setIsInitialized(true);
      return;
    }

    // Check if it's a page
    if (segments[0] === 'page') {
      const pageId = segments[1];
      const page = mockData.pages.find(p => p.id === pageId);
      if (page) {
        setCurrentPath(['home', page.id]);
        setCurrentView({ type: 'txt', data: page });
      }
      setIsInitialized(true);
      return;
    }

    // Check if it's a folder path
    if (segments[0] === 'folder') {
      const folderIds = segments.slice(1);
      const folder = findFolderByPath(mockData.folders, folderIds);
      if (folder) {
        setCurrentPath(['home', ...folderIds]);
        setCurrentView({ type: 'folder', data: folder });
      }
    }

    setIsInitialized(true);
  }, [location.pathname, isInitialized]);

  // Sync URL when currentPath changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    if (currentPath.length <= 1) {
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    const lastSegment = currentPath[currentPath.length - 1];

    // Check if it's a page
    const page = mockData.pages.find(p => p.id === lastSegment);
    if (page) {
      const url = `/page/${page.id}`;
      if (location.pathname !== url) {
        navigate(url, { replace: true });
      }
      return;
    }

    // It's a folder
    const folderPath = currentPath.slice(1).join('/');
    const url = `/folder/${folderPath}`;
    if (location.pathname !== url) {
      navigate(url, { replace: true });
    }
  }, [currentPath, navigate, location.pathname, isInitialized]);

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
    const folder = findFolderById(mockData.folders, targetId);
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

    const folder = findFolderById(mockData.folders, targetId);
    if (folder) {
      openFolder(folder, targetPath.slice(1));
      return;
    }

    const page = mockData.pages.find(item => item.id === targetId);
    if (page) {
      openPage(page, targetPath.slice(0, -1));
    }
  };

  const openLightbox = (image: WorkItem, gallery: WorkItem[]) => {
    const index = gallery.findIndex(item => item.id === image.id);
    setLightboxImage(image);
    setLightboxGallery(gallery);
    setLightboxIndex(index >= 0 ? index : 0);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxGallery([]);
    setLightboxIndex(0);
  };

  const navigateToNextImage = () => {
    if (lightboxGallery.length === 0) return;
    const nextIndex = (lightboxIndex + 1) % lightboxGallery.length;
    setLightboxIndex(nextIndex);
    setLightboxImage(lightboxGallery[nextIndex]);
  };

  const navigateToPrevImage = () => {
    if (lightboxGallery.length === 0) return;
    const prevIndex =
      (lightboxIndex - 1 + lightboxGallery.length) % lightboxGallery.length;
    setLightboxIndex(prevIndex);
    setLightboxImage(lightboxGallery[prevIndex]);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        currentView,
        lightboxImage,
        lightboxGallery,
        lightboxIndex,
        allFolders,
        breadcrumbSegments,
        activePath,
        navigateTo,
        navigateBack,
        resetToHome,
        handleBreadcrumbSelect,
        openLightbox,
        closeLightbox,
        navigateToNextImage,
        navigateToPrevImage,
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
