import { useState, useEffect, useRef } from 'react';

const TRANSPARENT_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function LazyImage({ src, alt, className, placeholder }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(
    placeholder ?? TRANSPARENT_PLACEHOLDER,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previousSrcRef = useRef<string>();
  const placeholderRef = useRef<string | undefined>(placeholder);

  useEffect(() => {
    placeholderRef.current = placeholder;
    const resolvedPlaceholder = placeholder ?? TRANSPARENT_PLACEHOLDER;

    if (imageSrc !== src && imageSrc !== resolvedPlaceholder) {
      setImageSrc(resolvedPlaceholder);
    }
  }, [placeholder, imageSrc, src]);

  useEffect(() => {
    if (previousSrcRef.current === src) {
      return;
    }
    previousSrcRef.current = src;

    const node = imgRef.current;
    const nextPlaceholder =
      placeholderRef.current ?? TRANSPARENT_PLACEHOLDER;

    setIsLoaded(false);
    setImageSrc(nextPlaceholder);

    if (!node) {
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '150px',
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onLoad={() => {
        if (imageSrc === src) {
          setIsLoaded(true);
        }
      }}
      style={{
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
}
