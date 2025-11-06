import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { mockData } from '@/data/mockData';
import { SearchResult } from '@/types';
import { flattenFolders } from '@/utils/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchContextValue {
  searchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const allFolders = useMemo(() => flattenFolders(mockData.folders), []);

  // Clear search query when panel closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [];
    }

    const query = debouncedSearchQuery.toLowerCase();
    const results: SearchResult[] = [];

    allFolders.forEach(flatFolder => {
      if (flatFolder.folder.name.toLowerCase().includes(query)) {
        results.push({
          type: 'folder',
          id: flatFolder.folder.id,
          label: 'Folder',
          path: flatFolder.path,
          folder: flatFolder.folder,
        });
      }

      // Search work items within folder
      if (flatFolder.folder.items) {
        flatFolder.folder.items.forEach(workItem => {
          if (workItem.filename.toLowerCase().includes(query)) {
            results.push({
              type: 'work',
              id: workItem.id,
              label: 'Work',
              path: flatFolder.path,
              folder: flatFolder.folder,
              work: workItem,
            });
          }
        });
      }
    });

    // Search pages
    mockData.pages.forEach(page => {
      if (
        page.name.toLowerCase().includes(query) ||
        page.content.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'page',
          id: page.id,
          label: 'Text File',
          page: page,
        });
      }
    });

    return results;
  }, [debouncedSearchQuery, allFolders]);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  return (
    <SearchContext.Provider
      value={{
        searchOpen,
        searchQuery,
        searchResults,
        openSearch,
        closeSearch,
        setSearchQuery,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
