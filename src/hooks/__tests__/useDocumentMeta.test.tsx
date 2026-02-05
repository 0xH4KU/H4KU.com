import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useDocumentMeta } from '../useDocumentMeta';
import { DEFAULT_META } from '@/config/seo';
import { PAGE_IDS, ROUTES } from '@/config/routes';
import { buildAppUrl, buildFolderUrl } from '@/utils/urlHelpers';
import type { Page, WorkItem } from '@/types';

const navigationState = {
  currentView: null as
    | { type: 'txt'; data: Page }
    | { type: 'folder'; data: Record<string, unknown> }
    | null,
  currentPath: ['home'],
};

const lightboxState = {
  lightboxImage: null as WorkItem | null,
};

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => navigationState,
}));

vi.mock('@/contexts/LightboxContext', () => ({
  useLightbox: () => lightboxState,
}));

const MetaHarness = () => {
  useDocumentMeta();
  return null;
};

const cleanupMeta = () => {
  const selectors = [
    'meta[name="title"]',
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:image"]',
    'meta[property="og:url"]',
    'meta[property="og:type"]',
    'meta[property="og:site_name"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:url"]',
    'meta[name="twitter:card"]',
    'link[rel="canonical"]',
  ];
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(node => node.remove());
  });
  document.title = '';
};

describe('useDocumentMeta', () => {
  beforeEach(() => {
    navigationState.currentView = null;
    navigationState.currentPath = ['home'];
    lightboxState.lightboxImage = null;
  });

  afterEach(() => {
    cleanupMeta();
  });

  it('applies default metadata for the home view', async () => {
    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toBe(DEFAULT_META.title);
    });

    const ogTitle = document.querySelector(
      'meta[property="og:title"]'
    ) as HTMLMetaElement | null;
    expect(ogTitle?.content).toBe(DEFAULT_META.ogTitle);
  });

  it('updates metadata when a text page is active', async () => {
    navigationState.currentView = {
      type: 'txt',
      data: {
        id: 'about',
        name: 'About',
        type: 'txt',
        content: 'About the portfolio.',
      },
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('About');
    });

    const description = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    expect(description?.content).toContain('About the portfolio.');
  });

  it('falls back to the default title when a page name is empty', async () => {
    navigationState.currentView = {
      type: 'txt',
      data: {
        id: 'about',
        name: '   ',
        type: 'txt',
        content: 'About the portfolio.',
      },
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toBe(DEFAULT_META.title);
    });
  });

  it('prefers lightbox image metadata when available', async () => {
    navigationState.currentPath = ['home', 'featured'];
    lightboxState.lightboxImage = {
      itemType: 'work',
      id: 'hero',
      filename: 'hero.png',
      thumb: '/hero.png',
      full: '/hero.png',
      title: 'Hero',
      description: 'Hero artwork.',
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('Hero');
    });

    const ogImage = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement | null;
    expect(ogImage?.content).toContain('/hero.png');
  });

  it('uses a relative thumb when full images are missing', async () => {
    lightboxState.lightboxImage = {
      itemType: 'work',
      id: 'empty',
      filename: 'empty.png',
      thumb: 'images/thumb.png',
      full: '',
      title: 'Empty',
      description: '',
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('Empty');
    });

    const ogImage = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement | null;
    expect(ogImage?.content).toBe(buildAppUrl('/images/thumb.png'));
  });

  it('uses contact verify route for verification pages', async () => {
    navigationState.currentView = {
      type: 'txt',
      data: {
        id: PAGE_IDS.CONTACT_VERIFY,
        name: 'Verify',
        type: 'txt',
        content: 'Verify your contact request.',
      },
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('Verify');
    });

    const canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    expect(canonical?.href).toBe(buildAppUrl(ROUTES.CONTACT_VERIFY));
  });

  it('builds folder metadata and falls back when descriptions are empty', async () => {
    navigationState.currentView = {
      type: 'folder',
      data: {
        id: 'featured',
        name: 'Featured',
        description: '   ',
      },
    };
    navigationState.currentPath = ['home', 'featured', '2024'];

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('Featured');
    });

    const description = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    expect(description?.content).toBe("Browse Featured in HAKU's portfolio.");

    const canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    expect(canonical?.href).toBe(buildFolderUrl(['featured', '2024']));
  });

  it('trims long lightbox descriptions and resolves absolute images', async () => {
    const longDescription = `${'Artwork '.repeat(30)}details.`;

    lightboxState.lightboxImage = {
      itemType: 'work',
      id: 'hero',
      filename: 'hero.png',
      thumb: '/hero-thumb.png',
      full: 'https://cdn.h4ku.com/hero.png',
      title: '   ',
      description: longDescription,
    };

    render(<MetaHarness />);

    await waitFor(() => {
      expect(document.title).toContain('hero.png');
    });

    const description = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    expect(description?.content?.length).toBeLessThanOrEqual(160);
    expect(description?.content?.endsWith('...')).toBe(true);

    const ogImage = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement | null;
    expect(ogImage?.content).toBe('https://cdn.h4ku.com/hero.png');
  });
});
