import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import {
  DEBOUNCE_DELAYS,
  SIDEBAR_CONFIG,
  STORAGE_KEYS,
} from '@/config/constants';
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

  it('normalizes stored sidebar width values and syncs storage', async () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, JSON.stringify(9999));
    const { result } = renderHook(() => useSidebarContext(), { wrapper });

    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.MAX_WIDTH);
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH)).toBe(
        JSON.stringify(SIDEBAR_CONFIG.MAX_WIDTH)
      )
    );
  });

  it('clamps width updates to configured bounds', () => {
    const { result } = renderHook(() => useSidebarContext(), { wrapper });

    act(() => result.current.setSidebarWidth(SIDEBAR_CONFIG.MAX_WIDTH + 100));
    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.MAX_WIDTH);

    act(() => result.current.setSidebarWidth(SIDEBAR_CONFIG.MIN_WIDTH - 50));
    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.MIN_WIDTH);
  });

  it('falls back to default width when stored value is invalid', () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, JSON.stringify('oops'));
    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.DEFAULT_WIDTH);
    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH)).toBe(
      JSON.stringify(SIDEBAR_CONFIG.DEFAULT_WIDTH)
    );
  });

  it('resets to default width when a non-finite value is provided', () => {
    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    act(() => {
      result.current.setSidebarWidth(Number.POSITIVE_INFINITY);
    });
    expect(result.current.sidebarWidth).toBe(SIDEBAR_CONFIG.DEFAULT_WIDTH);
  });

  it('clears pending persistence timers before scheduling new ones', () => {
    const timers: Array<{ id: number; cleared: boolean }> = [];
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    const originalWindowSetTimeout = window.setTimeout;
    const originalWindowClearTimeout = window.clearTimeout;

    const fakeSetTimeout = vi
      .fn<typeof setTimeout>((cb, delay, ...args) => {
        if (typeof cb === 'function' && delay === DEBOUNCE_DELAYS.RESIZE) {
          const id = timers.length + 1;
          timers.push({ id, cleared: false });
          return id as unknown as ReturnType<typeof setTimeout>;
        }
        return originalSetTimeout(cb as TimerHandler, delay as number, ...args);
      })
      .mockName('fakeSetTimeout');

    const fakeClearTimeout = vi
      .fn<typeof clearTimeout>(id => {
        const timer = timers.find(entry => entry.id === (id as number));
        if (timer) {
          timer.cleared = true;
        }
        return undefined;
      })
      .mockName('fakeClearTimeout');

    globalThis.setTimeout = fakeSetTimeout;
    window.setTimeout = fakeSetTimeout;
    globalThis.clearTimeout = fakeClearTimeout;
    window.clearTimeout = fakeClearTimeout;

    try {
      const { result } = renderHook(() => useSidebarContext(), { wrapper });

      act(() => {
        result.current.setSidebarWidth(300);
        result.current.setSidebarWidth(280);
      });

      expect(timers.length).toBe(2);
      expect(timers[0].cleared).toBe(true);
    } finally {
      globalThis.setTimeout = originalSetTimeout;
      window.setTimeout = originalWindowSetTimeout;
      globalThis.clearTimeout = originalClearTimeout;
      window.clearTimeout = originalWindowClearTimeout;
    }
  });

  it('reacts to media query breakpoint changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_, cb) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useSidebarContext(), { wrapper });
    expect(result.current.isSidebarOpen).toBe(true);

    act(() => {
      listener?.({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current.isSidebarOpen).toBe(false);
  });
});

describe('useSidebarContext guard', () => {
  it('throws outside of provider scope', () => {
    expect(() => renderHook(() => useSidebarContext())).toThrow(
      /within a SidebarProvider/i
    );
  });
});
