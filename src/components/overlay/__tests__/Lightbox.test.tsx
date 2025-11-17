import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { useEffect, StrictMode } from 'react';
import Lightbox from '@/components/overlay/Lightbox';
import { LightboxProvider, useLightbox } from '@/contexts/LightboxContext';
import * as LightboxContextModule from '@/contexts/LightboxContext';
import type { ImageWorkItem, WorkItem } from '@/types';

const createWorkItem = (id: string): ImageWorkItem => ({
  itemType: 'work',
  id,
  filename: `${id}.png`,
  thumb: `/${id}.png`,
  full: `/${id}.png`,
});

const LightboxOpener = ({
  gallery,
  initialIndex = 0,
}: {
  gallery: ImageWorkItem[];
  initialIndex?: number;
}) => {
  const { openLightbox } = useLightbox();
  const safeIndex = Math.max(0, Math.min(initialIndex, gallery.length - 1));

  useEffect(() => {
    if (gallery.length === 0) {
      return;
    }
    openLightbox(gallery[safeIndex], gallery);
  }, [gallery, openLightbox, safeIndex]);

  return null;
};

const renderLightbox = (
  gallery: ImageWorkItem[],
  options: { initialIndex?: number } = {}
) =>
  render(
    <StrictMode>
      <LightboxProvider>
        <Lightbox />
        <LightboxOpener gallery={gallery} initialIndex={options.initialIndex} />
      </LightboxProvider>
    </StrictMode>
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Lightbox navigation', () => {
  it('moves exactly one step per navigation click', async () => {
    const gallery = [
      createWorkItem('img-1'),
      createWorkItem('img-2'),
      createWorkItem('img-3'),
      createWorkItem('img-4'),
    ];

    renderLightbox(gallery);

    await waitFor(() =>
      expect(screen.getByAltText('img-1.png')).toBeInTheDocument()
    );
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    const nextButton = screen.getByLabelText('Next image');

    fireEvent.click(nextButton);

    await waitFor(() =>
      expect(screen.getByAltText('img-2.png')).toBeInTheDocument()
    );
    expect(screen.getByText('2 / 4')).toBeInTheDocument();

    fireEvent.click(nextButton);

    await waitFor(() =>
      expect(screen.getByAltText('img-3.png')).toBeInTheDocument()
    );
    expect(screen.getByText('3 / 4')).toBeInTheDocument();

    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    await waitFor(() =>
      expect(screen.getByAltText('img-2.png')).toBeInTheDocument()
    );
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('renders metadata, keeps image clicks from closing, and closes via button', async () => {
    const gallery = [
      {
        ...createWorkItem('hero'),
        title: 'Lumina Aeon',
        date: '2025-11-15',
        description: 'Guardian of the bioluminal vault.',
        tags: ['arc', 'guardian'],
      },
    ];

    renderLightbox(gallery);

    await waitFor(() =>
      expect(screen.getByAltText('hero.png')).toBeInTheDocument()
    );

    const titleInstances = screen.getAllByText('Lumina Aeon');
    expect(titleInstances).toHaveLength(2);
    expect(screen.getByText('hero.png')).toBeInTheDocument();
    expect(screen.getByText('2025-11-15')).toBeInTheDocument();
    expect(screen.getByText('#arc')).toBeInTheDocument();
    expect(screen.getByText('#guardian')).toBeInTheDocument();

    fireEvent.click(screen.getByAltText('hero.png'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close lightbox'));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('supports keyboard navigation and overlay dismissal', async () => {
    const gallery = [
      createWorkItem('img-1'),
      createWorkItem('img-2'),
      createWorkItem('img-3'),
    ];

    renderLightbox(gallery);

    await waitFor(() =>
      expect(screen.getByAltText('img-1.png')).toBeInTheDocument()
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() =>
      expect(screen.getByAltText('img-2.png')).toBeInTheDocument()
    );

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() =>
      expect(screen.getByAltText('img-1.png')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('dialog'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes when Escape is pressed', async () => {
    const gallery = [createWorkItem('img-escape'), createWorkItem('img-2')];

    renderLightbox(gallery, { initialIndex: 1 });

    await waitFor(() =>
      expect(screen.getByAltText('img-2.png')).toBeInTheDocument()
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('initially renders nothing until an image is selected', () => {
    render(
      <StrictMode>
        <LightboxProvider>
          <Lightbox />
        </LightboxProvider>
      </StrictMode>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('gracefully closes if a non-image work item is encountered', () => {
    const closeLightbox = vi.fn();
    const mockContext = {
      lightboxImage: {
        itemType: 'page',
        id: 'txt-1',
        filename: 'info.txt',
        content: 'lorem',
      } as WorkItem,
      lightboxGallery: [],
      lightboxIndex: 0,
      openLightbox: vi.fn(),
      closeLightbox,
      navigateToNextImage: vi.fn(),
      navigateToPrevImage: vi.fn(),
    } as unknown as ReturnType<typeof LightboxContextModule.useLightbox>;

    const useLightboxSpy = vi
      .spyOn(LightboxContextModule, 'useLightbox')
      .mockReturnValue(mockContext);

    const { container } = render(<Lightbox />);
    expect(container.firstChild).toBeNull();
    expect(closeLightbox).toHaveBeenCalledTimes(1);

    useLightboxSpy.mockRestore();
  });
});
