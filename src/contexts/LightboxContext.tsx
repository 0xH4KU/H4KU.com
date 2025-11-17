import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { WorkItem } from '@/types';
import { getImageGallery } from '@/utils/workItems';

interface LightboxContextValue {
  lightboxImage: WorkItem | null;
  lightboxGallery: WorkItem[];
  lightboxIndex: number;
  openLightbox: (image: WorkItem, gallery: WorkItem[]) => void;
  closeLightbox: () => void;
  navigateToNextImage: () => void;
  navigateToPrevImage: () => void;
}

const LightboxContext = createContext<LightboxContextValue | undefined>(
  undefined
);

export const LightboxProvider = ({ children }: { children: ReactNode }) => {
  const [lightboxImage, setLightboxImage] = useState<WorkItem | null>(null);
  const [lightboxGallery, setLightboxGallery] = useState<WorkItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((image: WorkItem, gallery: WorkItem[]) => {
    const filteredGallery = getImageGallery({ items: gallery });
    const targetGallery =
      filteredGallery.length > 0 ? filteredGallery : gallery;
    const index = targetGallery.findIndex(item => item.id === image.id);
    setLightboxGallery(targetGallery);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxImage(image);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
    setLightboxGallery([]);
    setLightboxIndex(0);
  }, []);

  const navigateToNextImage = useCallback(() => {
    setLightboxGallery(currentGallery => {
      if (currentGallery.length === 0) return currentGallery;
      setLightboxIndex(prev => {
        const next = (prev + 1) % currentGallery.length;
        setLightboxImage(currentGallery[next]);
        return next;
      });
      return currentGallery;
    });
  }, []);

  const navigateToPrevImage = useCallback(() => {
    setLightboxGallery(currentGallery => {
      if (currentGallery.length === 0) return currentGallery;
      setLightboxIndex(prev => {
        const next = (prev - 1 + currentGallery.length) % currentGallery.length;
        setLightboxImage(currentGallery[next]);
        return next;
      });
      return currentGallery;
    });
  }, []);

  const value = useMemo(
    () => ({
      lightboxImage,
      lightboxGallery,
      lightboxIndex,
      openLightbox,
      closeLightbox,
      navigateToNextImage,
      navigateToPrevImage,
    }),
    [
      lightboxImage,
      lightboxGallery,
      lightboxIndex,
      openLightbox,
      closeLightbox,
      navigateToNextImage,
      navigateToPrevImage,
    ]
  );

  return (
    <LightboxContext.Provider value={value}>
      {children}
    </LightboxContext.Provider>
  );
};

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within LightboxProvider');
  }
  return context;
};
