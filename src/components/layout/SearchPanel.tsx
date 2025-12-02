import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  useCallback,
} from 'react';
import { useSearchResults, useSearchUI } from '@/contexts/SearchContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { SearchResult } from '@/types';
import { buildFolderUrl, buildPageUrl } from '@/utils/urlHelpers';
import { SEARCH_PANEL_ID } from '@/config/accessibility';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { navigateFromSearchResult } from '@/utils/searchNavigation';
import styles from './SearchPanel.module.css';

type ResultCategory = SearchResult['type'];

const CATEGORY_ORDER: ResultCategory[] = ['folder', 'page', 'work'];
const CATEGORY_LABELS: Record<ResultCategory, string> = {
  folder: 'Folders',
  work: 'Images & Files',
  page: 'Pages',
};

const CATEGORY_BATCH_SIZES: Record<ResultCategory, number> = {
  folder: 10,
  work: 12,
  page: 8,
};

const createDefaultLimits = () => ({ ...CATEGORY_BATCH_SIZES });

const formatResultMeta = (result: SearchResult) => {
  switch (result.type) {
    case 'folder':
      return `Folder • ${buildFolderUrl(result.path)}`;
    case 'page':
      return `Text • ${buildPageUrl(result.page.id)}`;
    case 'work':
      return result.work.itemType === 'page'
        ? `Text • ${buildPageUrl(result.work.id)}`
        : `Image • ${buildFolderUrl(result.path)}`;
    default:
      return undefined;
  }
};

type FormattedResult = SearchResult & { meta?: string };

const SearchPanel: React.FC = () => {
  const { searchOpen, searchQuery, setSearchQuery, closeSearch } =
    useSearchUI();
  const { searchResults } = useSearchResults();
  const { navigateTo } = useNavigation();
  const { openLightbox } = useLightbox();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visibleLimits, setVisibleLimits] = useState(createDefaultLimits);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap({
    containerRef: panelRef,
    active: searchOpen,
    initialFocusRef: inputRef,
    onEscape: closeSearch,
  });

  useEffect(() => {
    setVisibleLimits(createDefaultLimits());
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) {
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  const categorizedResults = useMemo(() => {
    return searchResults.reduce<Record<ResultCategory, SearchResult[]>>(
      (acc, result) => {
        acc[result.type].push(result);
        return acc;
      },
      {
        folder: [],
        work: [],
        page: [],
      }
    );
  }, [searchResults]);

  const resultSections = useMemo(() => {
    return CATEGORY_ORDER.map(category => {
      const total = categorizedResults[category].length;
      const limit = visibleLimits[category];
      const items = categorizedResults[category].slice(0, limit);
      const formattedItems = items.map(result => ({
        ...result,
        meta: formatResultMeta(result),
      }));

      return {
        category,
        label: CATEGORY_LABELS[category],
        items: formattedItems,
        total,
        visibleCount: items.length,
        hasMore: total > items.length,
      };
    });
  }, [categorizedResults, visibleLimits]);

  const flattenedResults = useMemo<FormattedResult[]>(() => {
    return resultSections.flatMap(section => section.items);
  }, [resultSections]);

  useEffect(() => {
    if (flattenedResults.length === 0) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex(prev => Math.min(prev, flattenedResults.length - 1));
  }, [flattenedResults.length]);

  const handleShowMore = useCallback(
    (category: ResultCategory) => {
      setVisibleLimits(prev => {
        const max = categorizedResults[category].length;
        const nextLimit = Math.min(
          prev[category] + CATEGORY_BATCH_SIZES[category],
          max
        );
        if (nextLimit === prev[category]) {
          return prev;
        }
        return {
          ...prev,
          [category]: nextLimit,
        };
      });
    },
    [categorizedResults]
  );

  const handleSelect = (result: SearchResult) => {
    navigateFromSearchResult(result, { navigateTo, openLightbox });
    closeSearch();
  };

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && flattenedResults.length > 0) {
      handleSelect(flattenedResults[selectedIndex]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev =>
        prev < flattenedResults.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    }
  };

  const handleClose = () => {
    closeSearch();
  };

  if (!searchOpen) {
    return null;
  }

  let runningIndex = 0;

  return (
    <div
      className={styles['search-overlay']}
      role="presentation"
      onClick={handleClose}
    >
      <div
        className={styles['search-panel']}
        id={SEARCH_PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Search panel"
        aria-describedby={descriptionId}
        ref={panelRef}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <div className={styles['sr-only']} id={titleId}>
          Search lum.bio
        </div>
        <p className={styles['sr-only']} id={descriptionId}>
          Type to search folders, images, and text files. Use arrow keys to
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
              Start typing to search folders, images, and text files
            </div>
          )}
          {searchQuery.trim().length > 0 && flattenedResults.length === 0 && (
            <div className={styles['search-empty']}>No matches found</div>
          )}
          {searchQuery.trim().length > 0 &&
            resultSections.some(section => section.total > 0) &&
            resultSections.map(section => {
              if (section.total === 0) {
                return null;
              }

              return (
                <section
                  key={section.category}
                  className={styles['search-section']}
                  aria-label={`${section.label} results`}
                >
                  <div className={styles['search-section-header']}>
                    <span>{section.label}</span>
                    <span className={styles['search-section-count']}>
                      {section.visibleCount} of {section.total}
                    </span>
                  </div>
                  <div className={styles['search-section-results']}>
                    {section.items.map(result => {
                      const currentIndex = runningIndex;
                      runningIndex += 1;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          className={`${styles['search-result']} ${currentIndex === selectedIndex ? styles['search-result--selected'] : ''}`}
                          type="button"
                          onClick={() => handleSelect(result)}
                          aria-pressed={currentIndex === selectedIndex}
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
                      );
                    })}
                  </div>
                  {section.hasMore && (
                    <button
                      type="button"
                      className={styles['search-show-more']}
                      onClick={() => handleShowMore(section.category)}
                    >
                      Show more ({section.total - section.visibleCount}{' '}
                      remaining)
                    </button>
                  )}
                </section>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
