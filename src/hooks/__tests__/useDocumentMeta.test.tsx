import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useDocumentMeta } from '../useDocumentMeta';
import { DEFAULT_META } from '@/config/seo';
import type { Page, WorkItem } from '@/types';

const navigationState = {
  currentView: null as { type: 'txt'; data: Page } | { type: 'folder'; data: any } | null,
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

  it('prefers lightbox image metadata when available', async () => {
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
});
