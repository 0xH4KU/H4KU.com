import { useEffect, useRef } from 'react';
import type { Folder, Page, SearchResult } from '@/types';

type SidebarEntry = Folder | Page;

type SidebarKeyboardNavigationOptions = {
  isSidebarOpen: boolean;
  sidebarQuery: string;
  sidebarResults: SearchResult[];
  allVisibleItems: SidebarEntry[];
  focusedIndex: number;
  setFocusedIndex: (updater: (prev: number) => number) => void;
  handleSearchResultSelect: (result: SearchResult) => void;
  handleNavigate: (item: SidebarEntry) => void;
  sidebarElement: HTMLDivElement | null;
};

type KeybindingSnapshot = SidebarKeyboardNavigationOptions;

export const useSidebarKeyboardNavigation = (
  options: SidebarKeyboardNavigationOptions
) => {
  const stateRef = useRef<KeybindingSnapshot | null>(null);

  useEffect(() => {
    stateRef.current = {
      ...options,
    };
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state?.isSidebarOpen) {
        return;
      }

      const target = event.target as EventTarget | null;
      const elementTarget =
        target && target instanceof HTMLElement ? target : null;
      if (elementTarget && state.sidebarElement?.contains(elementTarget)) {
        return;
      }

      const isSearching =
        state.sidebarQuery.trim().length > 0 && state.sidebarResults.length > 0;

      if (isSearching) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            state.setFocusedIndex(prev =>
              prev < state.sidebarResults.length - 1 ? prev + 1 : prev
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            state.setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
            break;
          case 'Enter':
            if (
              state.focusedIndex >= 0 &&
              state.sidebarResults[state.focusedIndex]
            ) {
              state.handleSearchResultSelect(
                state.sidebarResults[state.focusedIndex]
              );
            }
            break;
          case 'Escape':
            // Caller decides如何清除 query；這裡只 reset index。
            state.setFocusedIndex(() => 0);
            break;
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          state.setFocusedIndex(prev =>
            prev < state.allVisibleItems.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          state.setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          if (
            state.focusedIndex >= 0 &&
            state.allVisibleItems[state.focusedIndex]
          ) {
            state.handleNavigate(state.allVisibleItems[state.focusedIndex]);
          }
          break;
        case 'Escape':
          state.setFocusedIndex(() => 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
