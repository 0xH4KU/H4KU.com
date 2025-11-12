import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { mockData } from '@/data/mockData';
import { Folder, Page, SearchResult, WorkItem } from '@/types';
import { buildNavigationMap } from '@/utils/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_DELAYS } from '@/config/constants';

interface SearchUIContextValue {
  searchOpen: boolean;
  searchQuery: string;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
}

interface SearchResultsContextValue {
  searchResults: SearchResult[];
}

const SearchUIContext = createContext<SearchUIContextValue | undefined>(
  undefined
);
const SearchResultsContext = createContext<
  SearchResultsContextValue | undefined
>(undefined);

const doesWorkItemMatch = (workItem: WorkItem, query: string) => {
  const normalizedFilename = workItem.filename.toLowerCase();
  if (normalizedFilename.includes(query)) {
    return true;
  }

  if (workItem.title?.toLowerCase().includes(query)) {
    return true;
  }

  if (workItem.description?.toLowerCase().includes(query)) {
    return true;
  }

  if (workItem.tags?.some(tag => tag.toLowerCase().includes(query))) {
    return true;
  }

  if (
    workItem.itemType === 'page' &&
    'content' in workItem &&
    workItem.content.toLowerCase().includes(query)
  ) {
    return true;
  }

  return false;
};

interface FolderIndexEntry {
  folder: Folder;
  path: string[];
  searchableLabel: string;
}

interface StandalonePageEntry {
  page: Page;
  searchableName: string;
  searchableContent: string;
}

const buildFolderIndex = (): FolderIndexEntry[] => {
  // Reuse NavigationMap for consistency and efficiency
  const navMap = buildNavigationMap(mockData.folders);
  return navMap.flattened.map(flatFolder => ({
    folder: flatFolder.folder,
    path: flatFolder.path,
    searchableLabel: flatFolder.folder.name.toLowerCase(),
  }));
};

const buildStandalonePageIndex = (): StandalonePageEntry[] =>
  mockData.pages.map(page => ({
    page,
    searchableName: page.name.toLowerCase(),
    searchableContent: page.content.toLowerCase(),
  }));

const buildHomeFolder = (): Folder | null => {
  if (mockData.homeItems.length === 0) {
    return null;
  }
  return {
    id: 'home',
    name: 'Home',
    type: 'folder',
    items: mockData.homeItems,
  };
};

const SearchResultsProvider = ({
  children,
  query,
}: {
  children: ReactNode;
  query: string;
}) => {
  const debouncedSearchQuery = useDebounce(query, DEBOUNCE_DELAYS.SEARCH);
  const folderIndex = useMemo(() => buildFolderIndex(), []);
  const standalonePages = useMemo(() => buildStandalonePageIndex(), []);
  const homeFolder = useMemo(() => buildHomeFolder(), []);

  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [];
    }

    const queryValue = debouncedSearchQuery.toLowerCase();
    const results: SearchResult[] = [];

    folderIndex.forEach(entry => {
      if (entry.searchableLabel.includes(queryValue)) {
        results.push({
          type: 'folder',
          id: entry.folder.id,
          label: 'Folder',
          path: entry.path,
          folder: entry.folder,
        });
      }

      entry.folder.items?.forEach(workItem => {
        if (doesWorkItemMatch(workItem, queryValue)) {
          results.push({
            type: 'work',
            id: workItem.id,
            label: 'Work',
            path: entry.path,
            folder: entry.folder,
            work: workItem,
          });
        }
      });
    });

    standalonePages.forEach(entry => {
      if (
        entry.searchableName.includes(queryValue) ||
        entry.searchableContent.includes(queryValue)
      ) {
        results.push({
          type: 'page',
          id: entry.page.id,
          label: 'Text File',
          page: entry.page,
        });
      }
    });

    if (homeFolder?.items?.length) {
      homeFolder.items.forEach(workItem => {
        if (doesWorkItemMatch(workItem, queryValue)) {
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
  }, [debouncedSearchQuery, folderIndex, standalonePages, homeFolder]);

  const resultsValue = useMemo(
    () => ({ searchResults }),
    [searchResults]
  );

  return (
    <SearchResultsContext.Provider value={resultsValue}>
      {children}
    </SearchResultsContext.Provider>
  );
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const uiValue = useMemo(
    () => ({
      searchOpen,
      searchQuery,
      openSearch,
      closeSearch,
      setSearchQuery,
    }),
    [searchOpen, searchQuery, openSearch, closeSearch]
  );

  return (
    <SearchUIContext.Provider value={uiValue}>
      <SearchResultsProvider query={searchQuery}>
        {children}
      </SearchResultsProvider>
    </SearchUIContext.Provider>
  );
}

export function useSearchUI() {
  const context = useContext(SearchUIContext);
  if (!context) {
    throw new Error('useSearchUI must be used within SearchProvider');
  }
  return context;
}

export function useSearchResults() {
  const context = useContext(SearchResultsContext);
  if (!context) {
    throw new Error('useSearchResults must be used within SearchProvider');
  }
  return context;
}

export function useSearch() {
  return {
    ...useSearchUI(),
    ...useSearchResults(),
  };
}
