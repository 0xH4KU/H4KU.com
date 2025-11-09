import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { mockData } from '@/data/mockData';
import { Folder, SearchResult, WorkItem } from '@/types';
import { flattenFolders } from '@/utils/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_DELAYS } from '@/config/constants';

interface SearchContextValue {
  searchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const doesWorkItemMatch = (workItem: WorkItem, query: string) => {
  const matchesFilename = workItem.filename.toLowerCase().includes(query);
  const matchesTitle = workItem.title?.toLowerCase().includes(query);
  const matchesDescription = workItem.description
    ?.toLowerCase()
    .includes(query);
  const matchesTags = workItem.tags?.some(tag =>
    tag.toLowerCase().includes(query)
  );
  const matchesContent =
    workItem.itemType === 'page' && 'content' in workItem
      ? workItem.content.toLowerCase().includes(query)
      : false;

  return (
    matchesFilename ||
    matchesTitle ||
    matchesDescription ||
    matchesTags ||
    matchesContent
  );
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAYS.SEARCH);
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
          if (doesWorkItemMatch(workItem, query)) {
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

    // Search works on home (no folder)
    if (mockData.homeItems.length > 0) {
      const homeFolder: Folder = {
        id: 'home',
        name: 'Home',
        type: 'folder',
        items: mockData.homeItems,
      };

      mockData.homeItems.forEach(workItem => {
        if (doesWorkItemMatch(workItem, query)) {
          results.push({
            type: 'work',
            id: workItem.id,
            label: 'Work',
            path: ['home'],
            folder: homeFolder,
            work: workItem,
          });
        }
      });
    }

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
