import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { SIDEBAR_CONFIG } from '@/config/constants';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
);

describe('SidebarContext', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: SIDEBAR_CONFIG.MOBILE_BREAKPOINT + 100,
    });
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('toggles open state and respects open/close helpers', () => {
    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    expect(result.current.isSidebarOpen).toBe(true);

    act(() => result.current.toggleSidebar());
    expect(result.current.isSidebarOpen).toBe(false);

    act(() => result.current.openSidebar());
    expect(result.current.isSidebarOpen).toBe(true);

    act(() => result.current.closeSidebar());
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('manages expanded folders and bulk expand/collapse', () => {
    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    const folderId = 'folder-1';

    act(() => result.current.toggleFolder(folderId));
    expect(result.current.expandedFolders.has(folderId)).toBe(true);

    act(() => result.current.toggleFolder(folderId));
    expect(result.current.expandedFolders.has(folderId)).toBe(false);

    act(() => result.current.expandFolder(folderId));
    expect(result.current.expandedFolders.has(folderId)).toBe(true);

    act(() => result.current.collapseFolder(folderId));
    expect(result.current.expandedFolders.has(folderId)).toBe(false);

    act(() => result.current.expandAll(['folder-1', 'folder-2']));
    expect(result.current.expandedFolders.has('folder-2')).toBe(true);

    act(() => result.current.collapseAll());
    expect(result.current.expandedFolders.size).toBe(0);
  });

  it('pins items and persists sidebar width', () => {
    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    const itemId = 'work-1';

    act(() => result.current.togglePin(itemId));
    expect(result.current.pinnedItems.has(itemId)).toBe(true);

    act(() => result.current.togglePin(itemId));
    expect(result.current.pinnedItems.has(itemId)).toBe(false);

    act(() => result.current.setSidebarWidth(320));
    expect(result.current.sidebarWidth).toBe(320);
  });
});
