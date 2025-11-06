import React, { useEffect, useMemo, useRef } from 'react';
import { SearchResult } from '@/types';

interface SearchPanelProps {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}

const buildPathLabel = (path: string[]): string => {
  if (!path.length) {
    return 'lum.bio';
  }
  return `lum.bio/${path.join('/')}`;
};

const SearchPanel: React.FC<SearchPanelProps> = ({
  open,
  query,
  onQueryChange,
  results,
  onSelect,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  type FormattedResult = SearchResult & { meta?: string };

  const formattedResults = useMemo<FormattedResult[]>(
    () =>
      results.map((result) => {
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
    [results],
  );

  if (!open) {
    return null;
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && formattedResults.length) {
      onSelect(formattedResults[0]);
    }
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Type to search…"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button type="button" onClick={onClose} className="search-close-btn">
          ×
        </button>
      </div>
      <div className="search-results">
        {query.trim().length === 0 && (
          <div className="search-hint">Start typing to search folders, works, and text files</div>
        )}
        {query.trim().length > 0 && formattedResults.length === 0 && (
          <div className="search-empty">No matches found</div>
        )}
        {formattedResults.map((result) => (
          <button
            key={`${result.type}-${result.id}`}
            className="search-result"
            type="button"
            onClick={() => onSelect(result)}
          >
            <div className="search-result-label">{result.label}</div>
            {'meta' in result && result.meta ? (
              <div className="search-result-meta">{result.meta}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchPanel;
