import { afterEach, describe, expect, it } from 'vitest';
import { updateDocumentMeta } from '../documentMeta';

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

afterEach(() => {
  cleanupMeta();
});

describe('updateDocumentMeta', () => {
  it('creates tags with fallbacks and updates existing tags', () => {
    const baseMeta = {
      title: 'HAKU Portfolio',
      description: 'Default description',
      url: 'https://h4ku.com/',
      image: 'https://h4ku.com/og.png',
    };

    updateDocumentMeta(baseMeta);

    expect(document.title).toBe('HAKU Portfolio');
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content')
    ).toBe('HAKU Portfolio');
    expect(
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute('content')
    ).toBe('Default description');
    expect(
      document
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute('content')
    ).toBe('HAKU Portfolio');
    expect(
      document
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute('content')
    ).toBe('Default description');
    expect(
      document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute('content')
    ).toBe('summary_large_image');
    expect(
      document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute('content')
    ).toBe('website');
    expect(document.querySelector('meta[property="og:site_name"]')).toBeNull();

    const overrideMeta = {
      ...baseMeta,
      title: 'New Title',
      description: 'Updated description',
      url: 'https://h4ku.com/about',
      ogTitle: 'OG Title',
      ogDescription: 'OG Description',
      ogType: 'article',
      twitterTitle: 'TW Title',
      twitterDescription: 'TW Description',
      twitterCard: 'summary',
      siteName: 'HAKU',
    };

    updateDocumentMeta(overrideMeta);

    expect(document.title).toBe('New Title');
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content')
    ).toBe('OG Title');
    expect(
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute('content')
    ).toBe('OG Description');
    expect(
      document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute('content')
    ).toBe('article');
    expect(
      document
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute('content')
    ).toBe('HAKU');
    expect(
      document
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute('content')
    ).toBe('TW Title');
    expect(
      document
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute('content')
    ).toBe('TW Description');
    expect(
      document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute('content')
    ).toBe('summary');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    ).toBe('https://h4ku.com/about');
  });
});
