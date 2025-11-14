import { lazy, Suspense, useEffect, useState } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import {
  ContentView,
  Crosshair,
  Sidebar,
  StatusBar,
  TopBar,
} from '@/components';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CopyrightWarning } from '@/components/common/CopyrightWarning';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { SortProvider } from '@/contexts/SortContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { use100vh } from '@/hooks/use100vh';
import {
  verifyDomain,
  logDomainVerification,
  getAuthorizedDomains,
  type DomainCheckResult,
} from '@/utils/domainCheck';
import { injectAllFingerprints } from '@/utils/fingerprint';
import {
  displayConsoleCopyright,
  displayDevCopyright,
} from '@/utils/consoleCopyright';
import styles from './App.module.css';

// Lazy load heavy components
const Lightbox = lazy(() => import('@/components/overlay/Lightbox'));
const SearchPanelLazy = lazy(() => import('@/components/layout/SearchPanel'));

const AppContent: React.FC = () => {
  const { isSidebarOpen, closeSidebar, sidebarWidth } = useSidebarContext();
  const { width } = useWindowSize();
  const [domainCheckResult, setDomainCheckResult] = useState<DomainCheckResult>(
    {
      isAuthorized: true,
      currentDomain: '',
      shouldBlock: false,
    }
  );

  use100vh();
  const isMobile = width !== undefined && width < 768;
  const showOverlay = isMobile && isSidebarOpen;

  // Security initialization: domain check, fingerprinting, and copyright notice
  useEffect(() => {
    // Verify domain authorization
    const result = verifyDomain();
    setDomainCheckResult(result);
    logDomainVerification(result);

    // Inject digital fingerprints into the DOM
    injectAllFingerprints();

    // Display copyright notice in console
    if (import.meta.env.PROD) {
      displayConsoleCopyright();
    } else {
      displayDevCopyright();
    }
  }, []);

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
    <LazyMotion features={domAnimation} strict>
      <div
        className={`${styles.app} ${
          domainCheckResult.shouldBlock ? styles.appLocked : ''
        }`}
      >
        {/* Show copyright warning overlay on unauthorized domains */}
        {!domainCheckResult.isAuthorized && (
          <CopyrightWarning
            currentDomain={domainCheckResult.currentDomain}
            authorizedDomains={getAuthorizedDomains()}
          />
        )}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Crosshair />
        <ErrorBoundary>
          <TopBar />
        </ErrorBoundary>
        <div
          className={`${styles['main-layout']} ${
            showOverlay ? styles['sidebar-open'] : ''
          }`}
          aria-hidden={domainCheckResult.shouldBlock}
        >
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
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
            <ErrorBoundary>
              <ContentView />
            </ErrorBoundary>
          </div>
        </div>
        <ErrorBoundary>
          <StatusBar />
        </ErrorBoundary>
        <Suspense fallback={null}>
          <ErrorBoundary>
            <Lightbox />
          </ErrorBoundary>
          <ErrorBoundary>
            <SearchPanelLazy />
          </ErrorBoundary>
        </Suspense>
      </div>
    </LazyMotion>
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
