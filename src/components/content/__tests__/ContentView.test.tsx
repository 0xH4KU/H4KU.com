import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentView from '../ContentView';
import type { Folder, Page, WorkItem } from '@/types';

const mocks = vi.hoisted(() => {
  const folder: Folder = {
    id: 'folder-1',
    name: 'Folder One',
    type: 'folder',
    items: [],
    children: [],
  };

  const page: Page = {
    id: 'page-1',
    name: 'Page One',
    type: 'txt',
    content: 'Hello',
  };

  const workItem: WorkItem = {
    itemType: 'work',
    id: 'work-1',
    filename: 'Work One',
    thumb: '/work-1.png',
    full: '/work-1.png',
  };

  return {
    folder,
    page,
    workItem,
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    openLightbox: vi.fn(),
    mockData: {
      folders: [folder],
      pages: [page],
      homeItems: [workItem],
      socials: [],
    },
  };
});

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({
    currentView: null,
    currentPath: ['home'],
    navigateTo: mocks.navigateTo,
    navigateBack: mocks.navigateBack,
  }),
}));

vi.mock('@/contexts/LightboxContext', () => ({
  useLightbox: () => ({
    openLightbox: mocks.openLightbox,
  }),
}));

vi.mock('@/contexts/SortContext', () => ({
  useSortOrder: () => ({
    sortOrder: 'desc',
    typeOrder: 'folders-first',
  }),
}));

vi.mock('@/data/mockData', () => ({
  mockData: mocks.mockData,
}));

describe('ContentView', () => {
  beforeEach(() => {
    mocks.navigateTo.mockClear();
    mocks.navigateBack.mockClear();
    mocks.openLightbox.mockClear();
  });

  it('renders home view folders and pages', () => {
    render(<ContentView />);

    expect(screen.getByText('Folder One')).toBeInTheDocument();
    expect(screen.getByText('Page One')).toBeInTheDocument();
  });

  it('navigates when folder and page buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<ContentView />);

    await user.click(screen.getByRole('button', { name: /Folder One/i }));
    await user.click(screen.getByRole('button', { name: /Page One/i }));

    expect(mocks.navigateTo).toHaveBeenCalledWith(mocks.folder);
    expect(mocks.navigateTo).toHaveBeenCalledWith(mocks.page);
  });

  it('opens lightbox for work items on the home grid', async () => {
    const user = userEvent.setup();
    render(<ContentView />);

    await user.click(screen.getByRole('button', { name: /Work One/i }));

    expect(mocks.openLightbox).toHaveBeenCalledTimes(1);
    const call = mocks.openLightbox.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) return;
    const [item, gallery] = call;
    expect(item).toMatchObject({ id: 'work-1' });
    expect(Array.isArray(gallery)).toBe(true);
  });
});
