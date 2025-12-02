import { lazy, Suspense, useEffect, useState } from 'react';
import { LazyMotion } from 'framer-motion';
import {
  ContentView,
  Crosshair,
  Sidebar,
  StatusBar,
  TopBar,
} from '@/components';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CopyrightWarning } from '@/components/common/CopyrightWarning';
import { AppProviders } from '@/contexts/AppProviders';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { use100vh } from '@/hooks/use100vh';
import type { DomainCheckResult } from '@/utils/domainCheck';
import styles from './App.module.css';

// Lazy load heavy components
const Lightbox = lazy(() => import('@/components/overlay/Lightbox'));
const SearchPanelLazy = lazy(() => import('@/components/layout/SearchPanel'));

const AppContent: React.FC = () => {
  const { isSidebarOpen, closeSidebar, sidebarWidth } = useSidebarContext();
  const { width } = useWindowSize();
  const [domainCheckResult, setDomainCheckResult] = useState<DomainCheckResult>(
    {
      isAllowed: true,
      currentDomain: '',
      shouldBlock: false,
    }
  );
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  use100vh();
  const isMobile = width !== undefined && width < 768;
  const showOverlay = isMobile && isSidebarOpen;

  // Security initialization: domain check, fingerprinting, and copyright notice
  useEffect(() => {
    let cancelled = false;

    const initSecurity = async () => {
      try {
        const [
          { verifyDomain, logDomainVerification, getAllowedDomains },
          { injectAllFingerprints },
          { displayConsoleCopyright, displayDevCopyright },
        ] = await Promise.all([
          import('@/utils/domainCheck'),
          import('@/utils/fingerprint'),
          import('@/utils/consoleCopyright'),
        ]);

        const result = verifyDomain();
        if (cancelled) return;

        setDomainCheckResult(result);
        setAllowedDomains(getAllowedDomains());
        logDomainVerification(result);
        injectAllFingerprints();

        if (import.meta.env.PROD) {
          displayConsoleCopyright();
        } else {
          displayDevCopyright();
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[security:init] failed', error);
        }
      }
    };

    void initSecurity();

    return () => {
      cancelled = true;
    };
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
    <LazyMotion
      features={() =>
        import('@/utils/motionFeatures').then(module => module.domAnimation)
      }
      strict
    >
      <div
        className={`${styles.app} ${
          domainCheckResult.shouldBlock ? styles.appLocked : ''
        }`}
      >
        {/* Show copyright warning overlay on unauthorized domains */}
        {!domainCheckResult.isAllowed && (
          <CopyrightWarning
            currentDomain={domainCheckResult.currentDomain}
            allowedDomains={allowedDomains}
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
            style={
              {
                '--sidebar-margin': isMobile
                  ? '0px'
                  : isSidebarOpen
                    ? `${sidebarWidth}px`
                    : '0px',
              } as React.CSSProperties
            }
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
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
