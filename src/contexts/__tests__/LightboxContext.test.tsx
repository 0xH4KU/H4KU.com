import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LightboxProvider, useLightbox } from '@/contexts/LightboxContext';
import type { ImageWorkItem, WorkItem } from '@/types';

const createWorkItem = (id: string): ImageWorkItem => ({
  itemType: 'work',
  id,
  filename: `${id}.png`,
  thumb: `/${id}.png`,
  full: `/${id}.png`,
});

const createWrapper = () => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <LightboxProvider>{children}</LightboxProvider>
  );
  Wrapper.displayName = 'LightboxTestWrapper';
  return Wrapper;
};

describe('LightboxProvider', () => {
  const gallery = [createWorkItem('img-1'), createWorkItem('img-2')];
  const firstImage = gallery[0]!;

  beforeEach(() => {
    // reset hook state per test via fresh renderHook
  });

  it('cycles forward and backward through gallery images', () => {
    const { result } = renderHook(() => useLightbox(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(firstImage, gallery);
    });
    expect(result.current.lightboxIndex).toBe(0);

    act(() => {
      result.current.navigateToNextImage();
    });
    expect(result.current.lightboxIndex).toBe(1);

    act(() => {
      result.current.navigateToNextImage();
    });
    expect(result.current.lightboxIndex).toBe(0);

    act(() => {
      result.current.navigateToPrevImage();
    });
    expect(result.current.lightboxIndex).toBe(1);
  });

  it('closes and resets lightbox state', () => {
    const { result } = renderHook(() => useLightbox(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(firstImage, gallery);
    });
    expect(result.current.lightboxGallery).toHaveLength(2);

    act(() => {
      result.current.closeLightbox();
    });
    expect(result.current.lightboxImage).toBeNull();
    expect(result.current.lightboxGallery).toHaveLength(0);
    expect(result.current.lightboxIndex).toBe(0);
  });

  it('defaults index to zero when the image is not in the gallery', () => {
    const outsider: WorkItem = {
      itemType: 'work',
      id: 'outside',
      filename: 'outside.png',
      thumb: '/outside.png',
      full: '/outside.png',
    };

    const { result } = renderHook(() => useLightbox(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(outsider, gallery);
    });

    expect(result.current.lightboxIndex).toBe(0);
    expect(result.current.lightboxGallery).toEqual(
      gallery.filter(item => item.itemType === 'work')
    );
    expect(result.current.lightboxImage?.id).toBe('outside');
  });

  it('handles navigation when gallery is empty', () => {
    const { result } = renderHook(() => useLightbox(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openLightbox(firstImage, []);
    });

    const indexBefore = result.current.lightboxIndex;

    act(() => {
      result.current.navigateToNextImage();
    });

    expect(result.current.lightboxIndex).toBe(indexBefore);

    act(() => {
      result.current.navigateToPrevImage();
    });

    expect(result.current.lightboxIndex).toBe(indexBefore);
  });

  it('throws error when useLightbox is used outside provider', () => {
    expect(() => {
      renderHook(() => useLightbox());
    }).toThrow('useLightbox must be used within LightboxProvider');
  });
});
