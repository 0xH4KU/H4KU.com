import React, { useEffect, useRef, useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLightbox } from '@/contexts/LightboxContext';
import { ImageWorkItem } from '@/types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import styles from './Lightbox.module.css';

const Lightbox: React.FC = () => {
  const {
    lightboxImage,
    lightboxGallery,
    lightboxIndex,
    closeLightbox,
    navigateToNextImage,
    navigateToPrevImage,
  } = useLightbox();
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  /* c8 ignore start */
  useFocusTrap({
    containerRef: lightboxRef,
    active: Boolean(lightboxImage),
    initialFocusRef: closeButtonRef,
    onEscape: closeLightbox,
  });

  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        navigateToNextImage();
      } else if (event.key === 'ArrowLeft') {
        /* c8 ignore next 3 */
        navigateToPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, closeLightbox, navigateToNextImage, navigateToPrevImage]);
  /* c8 ignore end */

  if (!lightboxImage) {
    return null;
  }

  // Type guard: Lightbox should only be used with image work items
  const imageItem = lightboxImage as ImageWorkItem;
  if (imageItem.itemType !== 'work') {
    // This shouldn't happen, but handle gracefully
    closeLightbox();
    return null;
  }

  const handleOverlayClick = () => {
    closeLightbox();
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
  };

  const handleCloseButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    closeLightbox();
  };

  const handlePrevButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigateToPrevImage();
  };

  const handleNextButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigateToNextImage();
  };

  const showNavigation = lightboxGallery.length > 1;

  return (
    <div
      ref={lightboxRef}
      className={styles.lightbox}
      data-overlay="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleOverlayClick}
      tabIndex={-1}
    >
      <div className={styles['sr-only']} id={titleId}>
        {imageItem.title || imageItem.filename}
      </div>
      <p className={styles['sr-only']} id={descriptionId}>
        Lightbox dialog. Use arrow keys to move between images, Escape to close.
      </p>
      <button
        ref={closeButtonRef}
        className={styles['lightbox-close']}
        onClick={handleCloseButton}
        aria-label="Close lightbox"
      >
        ×
      </button>

      {showNavigation && (
        <>
          <button
            className={`${styles['lightbox-nav']} ${styles['lightbox-nav--prev']}`}
            onClick={handlePrevButton}
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            className={`${styles['lightbox-nav']} ${styles['lightbox-nav--next']}`}
            onClick={handleNextButton}
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <picture>
        {imageItem.sources?.map(source => (
          <source
            key={`${source.type ?? 'image'}-${source.media ?? 'all'}-${source.srcSet}`}
            srcSet={source.srcSet}
            type={source.type}
            media={source.media}
          />
        ))}
        <img
          src={imageItem.full}
          alt={imageItem.filename}
          className={styles['lightbox-image']}
          onClick={handleImageClick}
          loading="eager"
          decoding="async"
        />
      </picture>

      <div className={styles['lightbox-info']}>
        <div className={styles['lightbox-metadata']}>
          {imageItem.title && (
            <div className={styles['metadata-title']}>{imageItem.title}</div>
          )}
          <div className={styles['metadata-basic']}>
            <span>{imageItem.filename}</span>
            {imageItem.date && (
              <>
                <span>|</span>
                <span>{imageItem.date}</span>
              </>
            )}
            {showNavigation && (
              <>
                <span>|</span>
                <span>
                  {lightboxIndex + 1} / {lightboxGallery.length}
                </span>
              </>
            )}
          </div>
          {imageItem.description && (
            <div className={styles['metadata-description']}>
              {imageItem.description}
            </div>
          )}
          {imageItem.tags && imageItem.tags.length > 0 && (
            <div className={styles['metadata-tags']}>
              {imageItem.tags.map(tag => (
                <span key={tag} className={styles['tag']}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
