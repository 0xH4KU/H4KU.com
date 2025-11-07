import { lazy, Suspense } from 'react';
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
import styles from './App.module.css';

// Lazy load heavy components
const Lightbox = lazy(() =>
  import('@/components').then(module => ({ default: module.Lightbox }))
);

function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <SearchProvider>
          <div className={styles.app}>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Crosshair />
            <TopBar />
            <div className={styles['main-layout']}>
              <Sidebar />
              <div
                id="main-content"
                className={styles['content-area']}
                role="main"
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
        </SearchProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}

export default App;
