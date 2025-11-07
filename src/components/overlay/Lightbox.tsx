import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import styles from './Lightbox.module.css';

const Lightbox: React.FC = () => {
  const {
    lightboxImage,
    lightboxGallery,
    lightboxIndex,
    closeLightbox,
    navigateToNextImage,
    navigateToPrevImage,
  } = useNavigation();

  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        navigateToNextImage();
      } else if (event.key === 'ArrowLeft') {
        navigateToPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, closeLightbox, navigateToNextImage, navigateToPrevImage]);

  if (!lightboxImage) {
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
    <div className={styles.lightbox} onClick={handleOverlayClick}>
      <button
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

      <img
        src={lightboxImage.full}
        alt={lightboxImage.filename}
        className={styles['lightbox-image']}
        onClick={handleImageClick}
      />

      <div className={styles['lightbox-info']}>
        <div className={styles['lightbox-metadata']}>
          {lightboxImage.title && (
            <div className={styles['metadata-title']}>
              {lightboxImage.title}
            </div>
          )}
          <div className={styles['metadata-basic']}>
            <span>{lightboxImage.filename}</span>
            {lightboxImage.date && (
              <>
                <span>|</span>
                <span>{lightboxImage.date}</span>
              </>
            )}
            {lightboxImage.dimensions && (
              <>
                <span>|</span>
                <span>{lightboxImage.dimensions}</span>
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
          {lightboxImage.description && (
            <div className={styles['metadata-description']}>
              {lightboxImage.description}
            </div>
          )}
          {lightboxImage.tags && lightboxImage.tags.length > 0 && (
            <div className={styles['metadata-tags']}>
              {lightboxImage.tags.map(tag => (
                <span key={tag} className={styles['tag']}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {lightboxImage.client && (
            <div className={styles['metadata-client']}>
              Client: {lightboxImage.client}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
