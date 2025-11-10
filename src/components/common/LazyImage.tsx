import { useState, useEffect, useRef } from 'react';

const TRANSPARENT_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// Fallback image when loading fails
const ERROR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5JbWFnZSBmYWlsZWQgdG8gbG9hZDwvdGV4dD48L3N2Zz4=';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(
    placeholder ?? TRANSPARENT_PLACEHOLDER
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previousSrcRef = useRef<string | undefined>(undefined);
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
    const nextPlaceholder = placeholderRef.current ?? TRANSPARENT_PLACEHOLDER;

    setIsLoaded(false);
    setHasError(false);
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
      }
    );

    // Use requestAnimationFrame to ensure element is rendered before observing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        observer.observe(node);
      });
    });

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleError = () => {
    if (!hasError && imageSrc === src) {
      setHasError(true);
      setImageSrc(ERROR_PLACEHOLDER);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    if (imageSrc === src || imageSrc === ERROR_PLACEHOLDER) {
      setIsLoaded(true);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      style={{
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
}
