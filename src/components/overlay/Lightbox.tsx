import React from 'react';
import { WorkItem } from '@/types';

interface LightboxProps {
  image: WorkItem | null;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ image, onClose }) => {
  if (!image) {
    return null;
  }

  const handleOverlayClick = () => onClose();
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
  };

  const handleCloseButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <div className="lightbox" onClick={handleOverlayClick}>
      <button className="lightbox-close" onClick={handleCloseButton}>
        ×
      </button>
      <img
        src={image.full}
        alt={image.filename}
        className="lightbox-image"
        onClick={handleImageClick}
      />
      <div className="lightbox-info">
        <span>{image.filename}</span>
        <span>|</span>
        <span>{image.date}</span>
        <span>|</span>
        <span>{image.dimensions}</span>
      </div>
    </div>
  );
};

export default Lightbox;
