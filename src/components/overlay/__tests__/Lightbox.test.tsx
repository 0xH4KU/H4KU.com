import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useEffect, StrictMode } from 'react';
import Lightbox from '@/components/overlay/Lightbox';
import { LightboxProvider, useLightbox } from '@/contexts/LightboxContext';
import type { ImageWorkItem } from '@/types';

const createWorkItem = (id: string): ImageWorkItem => ({
  itemType: 'work',
  id,
  filename: `${id}.png`,
  thumb: `/${id}.png`,
  full: `/${id}.png`,
});

const LightboxOpener = ({
  item,
  gallery,
}: {
  item: ImageWorkItem;
  gallery: ImageWorkItem[];
}) => {
  const { openLightbox } = useLightbox();

  useEffect(() => {
    openLightbox(item, gallery);
  }, [item, gallery, openLightbox]);

  return null;
};

const renderLightbox = (gallery: ImageWorkItem[]) => {
  render(
    <StrictMode>
      <LightboxProvider>
        <Lightbox />
        <LightboxOpener item={gallery[0]} gallery={gallery} />
      </LightboxProvider>
    </StrictMode>
  );
};

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
  });
});
