import React, { useCallback, useMemo } from 'react';
import { ChevronLeft, Moon, Sun, Search, Menu } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSearchUI } from '@/contexts/SearchContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { SEARCH_PANEL_ID } from '@/config/accessibility';
import Breadcrumb from './Breadcrumb';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const {
    breadcrumbSegments,
    navigateBack,
    handleBreadcrumbSelect,
    currentPath,
  } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { searchOpen, openSearch } = useSearchUI();
  const { isSidebarOpen, toggleSidebar } = useSidebarContext();

  const canGoBack = useMemo(() => currentPath.length > 1, [currentPath.length]);

  const handleBack = useCallback(() => {
    navigateBack();
  }, [navigateBack]);

  const handleToggleSearch = useCallback(() => {
    openSearch();
  }, [openSearch]);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleSelectPath = useCallback(
    (index: number) => {
      const segment = breadcrumbSegments[index];
      handleBreadcrumbSelect(segment.id, index);
    },
    [breadcrumbSegments, handleBreadcrumbSelect]
  );

  return (
    <div className={styles['top-bar']}>
      <div className={styles['nav-buttons']}>
        <button
          className={`${styles['nav-btn']} ${styles['sidebar-toggle']}`}
          onClick={toggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          aria-label={`${isSidebarOpen ? 'Close' : 'Open'} sidebar`}
        >
          <Menu size={16} />
        </button>
        <button
          className={styles['nav-btn']}
          onClick={handleBack}
          disabled={!canGoBack}
          aria-label="Go back"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <Breadcrumb segments={breadcrumbSegments} onSelect={handleSelectPath} />

      <button
        type="button"
        className={styles['search-btn']}
        onClick={handleToggleSearch}
        aria-haspopup="dialog"
        aria-expanded={searchOpen}
        aria-controls={SEARCH_PANEL_ID}
        aria-label="Search artworks"
      >
        <Search size={16} />
      </button>

      <button
        type="button"
        className={styles['theme-btn']}
        onClick={handleToggleTheme}
        aria-label={
          theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        }
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
};

export default TopBar;
