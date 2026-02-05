import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { SIDEBAR_CONFIG } from '@/config/constants';
import type { DomainCheckResult } from '@/utils/domainCheck';
import { reportError } from '@/utils/reportError';
import styles from './App.module.css';

// Lazy load heavy components
const Lightbox = lazy(() => import('@/components/overlay/Lightbox'));
const SearchPanelLazy = lazy(() => import('@/components/layout/SearchPanel'));

const AppContent: React.FC = () => {
  const { isSidebarOpen, closeSidebar } = useSidebarContext();
  const { width } = useWindowSize();
  const domainCheckRef = useRef<DomainCheckResult>({
    isAllowed: true,
    currentDomain: '',
    shouldBlock: false,
  });
  const allowedDomainsRef = useRef<string[]>([]);
  const [, forceSecurityRerender] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  useDocumentMeta();

  use100vh();
  const isCompactViewport =
    width !== undefined && width <= SIDEBAR_CONFIG.MOBILE_BREAKPOINT;
  const showOverlay = isCompactViewport && isSidebarOpen;

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

        domainCheckRef.current = result;
        allowedDomainsRef.current = getAllowedDomains();
        forceSecurityRerender(version => version + 1);
        logDomainVerification(result);
        injectAllFingerprints();

        if (import.meta.env.PROD) {
          displayConsoleCopyright();
        } else {
          displayDevCopyright();
        }
      } catch (error) {
        reportError(error, {
          scope: 'security:init',
          level: 'warn',
          logMode: 'dev',
        });
      }
    };

    void initSecurity();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const className = 'reduced-motion';
    const root = document.documentElement;
    if (prefersReducedMotion) {
      document.body.classList.add(className);
      root.classList.add(className);
    } else {
      document.body.classList.remove(className);
      root.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
      root.classList.remove(className);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const className = 'sidebar-overlay-open';
    if (showOverlay) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [showOverlay]);

  const domainCheckResult = domainCheckRef.current;
  const allowedDomains = allowedDomainsRef.current;

  return (
    <div
      className={`${styles.app} ${domainCheckResult.shouldBlock ? styles.appLocked : ''}`}
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
        className={`${styles['main-layout']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}
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
        <div id="main-content" className={styles['content-area']} role="main">
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
