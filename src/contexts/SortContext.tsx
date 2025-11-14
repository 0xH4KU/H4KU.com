import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type SortOrder = 'desc' | 'asc'; // desc = default (text A-Z / numbers high-low), asc = inverse
export type TypeOrder = 'folders-first' | 'images-first'; // folders-first = Folder > Page > Image, images-first = inverse

interface SortContextType {
  sortOrder: SortOrder;
  toggleSortOrder: () => void;
  typeOrder: TypeOrder;
  toggleTypeOrder: () => void;
}

const SortContext = createContext<SortContextType | undefined>(undefined);

export const SortProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Default sorting: text A-Z, numbers high-low
  const [sortOrder, setSortOrder] = useLocalStorage<SortOrder>(
    'sort-order',
    'desc'
  );
  const [typeOrder, setTypeOrder] = useLocalStorage<TypeOrder>(
    'type-order',
    'folders-first'
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  }, [setSortOrder]);

  const toggleTypeOrder = useCallback(() => {
    setTypeOrder(prev =>
      prev === 'folders-first' ? 'images-first' : 'folders-first'
    );
  }, [setTypeOrder]);

  return (
    <SortContext.Provider
      value={{ sortOrder, toggleSortOrder, typeOrder, toggleTypeOrder }}
    >
      {children}
    </SortContext.Provider>
  );
};

export const useSortOrder = () => {
  const context = useContext(SortContext);
  if (!context) {
    throw new Error('useSortOrder must be used within SortProvider');
  }
  return context;
};
