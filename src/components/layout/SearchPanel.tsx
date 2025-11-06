import React, { useEffect, useMemo, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { SearchResult } from '@/types';
import styles from './SearchPanel.module.css';

const buildPathLabel = (path: string[]): string => {
  if (!path.length) {
    return 'lum.bio';
  }
  return `lum.bio/${path.join('/')}`;
};

const SearchPanel: React.FC = () => {
  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    closeSearch,
  } = useSearch();
  const { navigateTo, openLightbox } = useNavigation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, closeSearch]);

  type FormattedResult = SearchResult & { meta?: string };

  const formattedResults = useMemo<FormattedResult[]>(
    () =>
      searchResults.map(result => {
        let meta: string | undefined;

        switch (result.type) {
          case 'folder':
            meta = `Folder • ${buildPathLabel(result.path)}`;
            break;
          case 'page':
            meta = `Text • lum.bio/${result.page.id}`;
            break;
          case 'work':
            meta = `Work • ${buildPathLabel(result.path)}`;
            break;
          default:
            meta = undefined;
        }

        return { ...result, meta };
      }),
    [searchResults]
  );

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'folder') {
      navigateTo(result.folder, result.path);
    } else if (result.type === 'page') {
      navigateTo(result.page);
    } else if (result.type === 'work') {
      openLightbox(result.work);
    }
    closeSearch();
  };

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleClose = () => {
    closeSearch();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && formattedResults.length) {
      handleSelect(formattedResults[0]);
    }
  };

  if (!searchOpen) {
    return null;
  }

  return (
    <div className={styles['search-panel']}>
      <div className={styles['search-header']}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          placeholder="Type to search…"
          onChange={event => handleQueryChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="button"
          onClick={handleClose}
          className={styles['search-close-btn']}
        >
          ×
        </button>
      </div>
      <div className={styles['search-results']}>
        {searchQuery.trim().length === 0 && (
          <div className={styles['search-hint']}>
            Start typing to search folders, works, and text files
          </div>
        )}
        {searchQuery.trim().length > 0 && formattedResults.length === 0 && (
          <div className={styles['search-empty']}>No matches found</div>
        )}
        {formattedResults.map(result => (
          <button
            key={`${result.type}-${result.id}`}
            className={styles['search-result']}
            type="button"
            onClick={() => handleSelect(result)}
          >
            <div className={styles['search-result-label']}>{result.label}</div>
            {'meta' in result && result.meta ? (
              <div className={styles['search-result-meta']}>{result.meta}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchPanel;
