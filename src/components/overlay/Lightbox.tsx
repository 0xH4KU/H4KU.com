import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import styles from './Lightbox.module.css';

const Lightbox: React.FC = () => {
  const { lightboxImage, closeLightbox } = useNavigation();

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

  return (
    <div className={styles.lightbox} onClick={handleOverlayClick}>
      <button className={styles['lightbox-close']} onClick={handleCloseButton}>
        ×
      </button>
      <img
        src={lightboxImage.full}
        alt={lightboxImage.filename}
        className={styles['lightbox-image']}
        onClick={handleImageClick}
      />
      <div className={styles['lightbox-info']}>
        <span>{lightboxImage.filename}</span>
        <span>|</span>
        <span>{lightboxImage.date}</span>
        <span>|</span>
        <span>{lightboxImage.dimensions}</span>
      </div>
    </div>
  );
};

export default Lightbox;
