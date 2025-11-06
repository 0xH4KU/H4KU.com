import React from 'react';
import { ChevronLeft, Moon, Sun, Search } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSearch } from '@/contexts/SearchContext';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const {
    breadcrumbSegments,
    navigateBack,
    handleBreadcrumbSelect,
    currentPath,
  } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { searchOpen, openSearch } = useSearch();

  const canGoBack = currentPath.length > 1;

  const handleBack = () => {
    navigateBack();
  };

  const handleToggleSearch = () => {
    openSearch();
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleSelectPath = (index: number) => {
    const segment = breadcrumbSegments[index];
    handleBreadcrumbSelect(segment.id, index);
  };

  return (
    <div className={styles['top-bar']}>
      <div className={styles['nav-buttons']}>
        <button
          className={styles['nav-btn']}
          onClick={handleBack}
          disabled={!canGoBack}
          aria-label="Go back"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className={styles.breadcrumb}>
        {breadcrumbSegments.map((segment, idx) => {
          const isActive = idx === breadcrumbSegments.length - 1;
          return idx === 0 ? (
            <button
              key={segment.id}
              type="button"
              className={styles['breadcrumb-link']}
              onClick={() => handleSelectPath(idx)}
              disabled={isActive}
            >
              lum.bio
            </button>
          ) : (
            <React.Fragment key={`${segment.id}-${idx}`}>
              <span className={styles['breadcrumb-sep']}>/</span>
              <button
                type="button"
                className={styles['breadcrumb-link']}
                onClick={() => handleSelectPath(idx)}
                disabled={isActive}
              >
                {segment.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <button
        className={styles['search-btn']}
        onClick={handleToggleSearch}
        aria-pressed={searchOpen}
      >
        <Search size={16} />
      </button>

      <button className={styles['theme-btn']} onClick={handleToggleTheme}>
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
};

export default TopBar;
