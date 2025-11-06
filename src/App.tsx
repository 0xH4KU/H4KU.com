import {
  ContentView,
  Crosshair,
  Lightbox,
  Sidebar,
  StatusBar,
  TopBar,
  SearchPanel,
} from '@/components';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SearchProvider } from '@/contexts/SearchContext';
import styles from './App.module.css';

function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <SearchProvider>
          <div className={styles.app}>
            <Crosshair />
            <TopBar />
            <div className={styles['main-layout']}>
              <Sidebar />
              <div className={styles['content-area']}>
                <ContentView />
              </div>
            </div>
            <StatusBar />
            <Lightbox />
            <SearchPanel />
          </div>
        </SearchProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}

export default App;
