import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (searchOpen) {
      previouslyFocusedElement.current =
        (document.activeElement as HTMLElement | null) ?? null;
      inputRef.current?.focus();
      setSelectedIndex(0);
      return;
    }

    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
    }
  }, [searchOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const getFocusableElements = () => {
      if (!panelRef.current) {
        return [];
      }

      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(selectors)
      ).filter(element => !element.hasAttribute('aria-hidden'));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      const gallery = result.folder.items || [];
      openLightbox(result.work, gallery);
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
    if (event.key === 'Enter' && formattedResults.length > 0) {
      handleSelect(formattedResults[selectedIndex]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev =>
        prev < formattedResults.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    }
  };

  if (!searchOpen) {
    return null;
  }

  return (
    <div
      className={styles['search-overlay']}
      role="presentation"
      onClick={handleClose}
    >
      <div
        className={styles['search-panel']}
        role="dialog"
        aria-modal="true"
        aria-label="Search panel"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={panelRef}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <div className={styles['sr-only']} id={titleId}>
          Search lum.bio
        </div>
        <p className={styles['sr-only']} id={descriptionId}>
          Type to search folders, works, and text files. Use arrow keys to
          navigate results and press Enter to open the selection.
        </p>
        <div className={styles['search-header']}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            placeholder="Type to search…"
            onChange={event => handleQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-describedby={descriptionId}
          />
          <button
            type="button"
            onClick={handleClose}
            className={styles['search-close-btn']}
            aria-label="Close search panel"
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
          {formattedResults.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              className={`${styles['search-result']} ${index === selectedIndex ? styles['search-result--selected'] : ''}`}
              type="button"
              onClick={() => handleSelect(result)}
            >
              <div className={styles['search-result-label']}>
                {result.label}
              </div>
              {'meta' in result && result.meta ? (
                <div className={styles['search-result-meta']}>
                  {result.meta}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
