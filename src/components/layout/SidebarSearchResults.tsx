import React from 'react';
import { Search } from 'lucide-react';
import { SearchResult } from '@/types';
import { buildFolderUrl, buildPageUrl } from '@/utils/urlHelpers';
import styles from './Sidebar.module.css';

interface SidebarSearchResultsProps {
  results: SearchResult[];
  focusedIndex: number;
  onSelect: (result: SearchResult) => void;
}

export const SidebarSearchResults: React.FC<SidebarSearchResultsProps> = ({
  results,
  focusedIndex,
  onSelect,
}) => {
  if (results.length === 0) {
    return (
      <div className={styles['empty-state']}>
        <Search size={32} />
        <p>No results found</p>
        <span>Try a different search term</span>
      </div>
    );
  }

  return (
    <div className={styles['search-results-container']}>
      {results.map((result, index) => {
        const isSelected = index === focusedIndex;
        let label = '';
        let meta = '';

        switch (result.type) {
          case 'folder':
            label = result.folder.name;
            meta = `Folder • ${buildFolderUrl(result.path)}`;
            break;
          case 'page':
            label = result.page.name;
            meta = `Text • ${buildPageUrl(result.page.id)}`;
            break;
          case 'work':
            label = result.work.filename;
            meta =
              result.work.itemType === 'page'
                ? `Text • ${buildPageUrl(result.work.id)}`
                : `Image • ${buildFolderUrl(result.path)}`;
            break;
        }

        return (
          <button
            key={`${result.type}-${result.id}`}
            type="button"
            className={`${styles['search-result']} ${isSelected ? styles['search-result--selected'] : ''}`}
            onClick={() => onSelect(result)}
            aria-selected={isSelected}
          >
            <div className={styles['search-result-label']}>{label}</div>
            <div className={styles['search-result-meta']}>{meta}</div>
          </button>
        );
      })}
    </div>
  );
};
