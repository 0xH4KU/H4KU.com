import { lazy, Suspense, useEffect } from 'react';
import {
  ContentView,
  Crosshair,
  Sidebar,
  StatusBar,
  TopBar,
  SearchPanel,
} from '@/components';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { SortProvider } from '@/contexts/SortContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { use100vh } from '@/hooks/use100vh';
import styles from './App.module.css';

// Lazy load heavy components
const Lightbox = lazy(() =>
  import('@/components').then(module => ({ default: module.Lightbox }))
);

const AppContent: React.FC = () => {
  const { isSidebarOpen, closeSidebar, sidebarWidth } = useSidebarContext();
  const { width } = useWindowSize();
  use100vh();
  const isMobile = width !== undefined && width < 768;
  const showOverlay = isMobile && isSidebarOpen;

  useEffect(() => {
    if (typeof document === 'undefined' || !showOverlay) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showOverlay]);

  return (
    <div className={styles.app}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Crosshair />
      <TopBar />
      <div
        className={`${styles['main-layout']} ${
          showOverlay ? styles['sidebar-open'] : ''
        }`}
      >
        <Sidebar />
        {showOverlay && (
          <button
            type="button"
            className={styles['sidebar-scrim']}
            aria-label="Close sidebar"
            onClick={closeSidebar}
          />
        )}
        <div
          id="main-content"
          className={styles['content-area']}
          role="main"
          style={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? sidebarWidth : 0,
          }}
        >
          <ContentView />
        </div>
      </div>
      <StatusBar />
      <Suspense fallback={null}>
        <Lightbox />
      </Suspense>
      <SearchPanel />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SortProvider>
        <NavigationProvider>
          <SearchProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </SearchProvider>
        </NavigationProvider>
      </SortProvider>
    </ThemeProvider>
  );
}

export default App;
