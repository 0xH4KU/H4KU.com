import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ImageSource } from '@/types';

const originalIntersectionObserver = window.IntersectionObserver;

const createIntersectionObserverMock = () => {
  let callback: IntersectionObserverCallback | null = null;
  const observe = vi.fn();
  const unobserve = vi.fn();

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }

    disconnect() {}
    observe = observe;
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve = unobserve;
  }

  const trigger = (entry: Partial<IntersectionObserverEntry>) => {
    if (!callback) return;
    callback([entry as IntersectionObserverEntry], {} as IntersectionObserver);
  };

  return { MockIntersectionObserver, observe, unobserve, trigger };
};

afterEach(() => {
  window.IntersectionObserver = originalIntersectionObserver;
  vi.resetModules();
});

describe('LazyImage', () => {
  it('lazy loads after intersection and wires sources/srcSet', async () => {
    const { MockIntersectionObserver, trigger } =
      createIntersectionObserverMock();
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    vi.resetModules();
    const { LazyImage } = await import('../LazyImage');

    const sources = [
      { type: 'image/avif', srcSet: '/hero.avif' },
      { type: 'image/webp', srcSet: '/hero.webp', media: '(min-width: 600px)' },
      { type: 'image/ignore', srcSet: '' },
    ] as ImageSource[];

    const { container } = render(
      <>
        <LazyImage
          src="/hero.png"
          srcSet="/hero@2x.png 2x"
          alt="Hero"
          sources={sources}
        />
        <LazyImage src="/sidekick.png" alt="Sidekick" />
      </>
    );

    const img = screen.getByRole('img', { name: 'Hero' });
    expect(img.getAttribute('src') ?? '').toContain('data:image/gif');
    expect(container.querySelector('picture')).toBeNull();

    act(() => {
      trigger({ isIntersecting: true, target: img });
    });

    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Hero' })).toHaveAttribute(
        'src',
        '/hero.png'
      )
    );
    expect(screen.getByRole('img', { name: 'Hero' })).toHaveAttribute(
      'srcset',
      '/hero@2x.png 2x'
    );

    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();
    expect(picture?.querySelectorAll('source')).toHaveLength(2);

    fireEvent.load(screen.getByRole('img', { name: 'Hero' }));
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Hero' })).toHaveAttribute(
        'data-loaded',
        'true'
      )
    );
  });

  it('does not load when not intersecting', async () => {
    const { MockIntersectionObserver, trigger } =
      createIntersectionObserverMock();
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    vi.resetModules();
    const { LazyImage } = await import('../LazyImage');

    render(<LazyImage src="/hero.png" alt="Hero" />);

    const img = screen.getByRole('img', { name: 'Hero' });

    act(() => {
      trigger({ isIntersecting: false, target: img });
    });

    await waitFor(() =>
      expect(img.getAttribute('src') ?? '').toContain('data:image/gif')
    );
  });

  it('loads immediately for priority and handles load errors', async () => {
    vi.resetModules();
    const { LazyImage } = await import('../LazyImage');

    const { container } = render(
      <LazyImage
        src="/hero.png"
        srcSet="/hero@2x.png 2x"
        alt="Hero"
        className="custom"
        priority
        sources={[{ type: 'image/webp', srcSet: '/hero.webp' }]}
      />
    );

    const img = screen.getByRole('img', { name: 'Hero' });

    expect(img).toHaveAttribute('src', '/hero.png');
    expect(img).toHaveAttribute('srcset', '/hero@2x.png 2x');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'sync');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).toHaveAttribute('data-priority', 'true');
    expect(img.className).toContain('custom');
    expect(container.querySelector('picture')).not.toBeNull();

    fireEvent.error(img);

    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: 'Hero' }).getAttribute('src') ?? ''
      ).toContain('data:image/svg+xml')
    );
  });

  it('falls back to immediate load when IntersectionObserver is missing', async () => {
    // @ts-expect-error - simulate missing IntersectionObserver
    delete window.IntersectionObserver;

    vi.resetModules();
    const { LazyImage } = await import('../LazyImage');

    render(<LazyImage src="/hero.png" alt="Hero" />);

    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Hero' })).toHaveAttribute(
        'src',
        '/hero.png'
      )
    );
  });

  it('keeps the placeholder when src is empty', async () => {
    vi.resetModules();
    const { LazyImage } = await import('../LazyImage');

    render(<LazyImage src="" alt="Empty" />);

    const img = screen.getByRole('img', { name: 'Empty' });
    expect(img.getAttribute('src') ?? '').toContain('data:image/gif');
    expect(img).toHaveAttribute('aria-busy', 'false');
  });
});
