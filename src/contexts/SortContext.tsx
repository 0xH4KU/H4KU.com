import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type SortOrder = 'desc' | 'asc'; // desc = 新的在前(Z-A), asc = 旧的在前(A-Z)

interface SortContextType {
  sortOrder: SortOrder;
  toggleSortOrder: () => void;
}

const SortContext = createContext<SortContextType | undefined>(undefined);

export const SortProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 默认倒序(新的在前)
  const [sortOrder, setSortOrder] = useLocalStorage<SortOrder>(
    'sort-order',
    'desc'
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  }, [setSortOrder]);

  return (
    <SortContext.Provider value={{ sortOrder, toggleSortOrder }}>
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
