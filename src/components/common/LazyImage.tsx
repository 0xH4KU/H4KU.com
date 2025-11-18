import { useEffect, useMemo, useRef, useState } from 'react';
import { IMAGE_CONFIG } from '@/config/constants';
import type { ImageSource } from '@/types';

const TRANSPARENT_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

// Fallback image when loading fails
const ERROR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5JbWFnZSBmYWlsZWQgdG8gbG9hZDwvdGV4dD48L3N2Zz4=';

type ObserverCallback = () => void;

const observerCallbacks = new Map<Element, ObserverCallback>();
let sharedObserver: IntersectionObserver | null = null;

const ensureObserver = () => {
  if (sharedObserver || typeof window === 'undefined') {
    return sharedObserver;
  }
  if (!('IntersectionObserver' in window)) {
    return null;
  }

  sharedObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = observerCallbacks.get(entry.target);
          if (callback) {
            callback();
            observerCallbacks.delete(entry.target);
          }
          sharedObserver?.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: IMAGE_CONFIG.LAZY_LOAD_ROOT_MARGIN,
      threshold: IMAGE_CONFIG.LAZY_LOAD_THRESHOLD,
    }
  );

  return sharedObserver;
};

const observeNode = (node: Element, callback: ObserverCallback) => {
  const observer = ensureObserver();
  if (!observer) {
    callback();
    return;
  }
  observerCallbacks.set(node, callback);
  observer.observe(node);
};

const unobserveNode = (node: Element) => {
  if (!observerCallbacks.has(node)) {
    return;
  }
  observerCallbacks.delete(node);
  sharedObserver?.unobserve(node);
};

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  /** Optional srcset for responsive images */
  srcSet?: string;
  /** Optional sizes attribute for responsive images */
  sizes?: string;
  /** Optional sources for picture element (e.g. AVIF/WebP) */
  sources?: ImageSource[];
  /** Elevate loading priority for hero / LCP imagery */
  priority?: boolean;
  /** Fine-grained control over the fetchpriority hint */
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  srcSet,
  sizes,
  sources,
  priority = false,
  fetchPriority = 'auto',
}: LazyImageProps) {
  const resolvedPlaceholder = placeholder ?? TRANSPARENT_PLACEHOLDER;
  const normalizedSources = useMemo(
    () =>
      sources?.filter(
        source => Boolean(source?.srcSet) && typeof source?.srcSet === 'string'
      ),
    [sources]
  );
  const [imageSrc, setImageSrc] = useState<string>(resolvedPlaceholder);
  const [imageSrcSet, setImageSrcSet] = useState<string | undefined>(undefined);
  const [activeSources, setActiveSources] = useState<ImageSource[] | undefined>(
    priority ? normalizedSources : undefined
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const node = imgRef.current;
    if (!node) {
      return;
    }

    setIsLoaded(false);
    setHasError(false);
    setImageSrc(priority ? src : resolvedPlaceholder);
    setImageSrcSet(priority ? srcSet : undefined);
    setActiveSources(priority ? normalizedSources : undefined);

    if (!src) {
      return;
    }

    if (priority) {
      return;
    }

    observeNode(node, () => {
      setImageSrc(src);
      if (srcSet) {
        setImageSrcSet(srcSet);
      }
      if (normalizedSources) {
        setActiveSources(normalizedSources);
      }
    });

    return () => {
      if (!priority) {
        unobserveNode(node);
      }
    };
  }, [src, srcSet, resolvedPlaceholder, priority, normalizedSources]);

  const handleError = () => {
    if (!hasError && imageSrc === src) {
      setHasError(true);
      setImageSrc(ERROR_PLACEHOLDER);
      setImageSrcSet(undefined);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    if (imageSrc === src || imageSrc === ERROR_PLACEHOLDER) {
      setIsLoaded(true);
    }
  };

  const isLoading = Boolean(src) && !isLoaded && !hasError;

  const pictureSources = activeSources ?? [];

  const imageElement = (
    <img
      ref={imgRef}
      src={imageSrc}
      srcSet={imageSrcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : fetchPriority}
      onLoad={handleLoad}
      onError={handleError}
      aria-busy={isLoading ? 'true' : 'false'}
      aria-live={!isLoading ? 'polite' : undefined}
      style={{
        opacity: isLoaded || priority ? 1 : 0.5,
        transition: priority ? 'none' : 'opacity 0.3s ease-in-out',
      }}
    />
  );

  if (pictureSources.length === 0) {
    return imageElement;
  }

  return (
    <picture>
      {pictureSources.map(source => (
        <source
          key={`${source.type ?? 'image'}-${source.media ?? 'all'}-${source.srcSet}`}
          type={source.type}
          srcSet={source.srcSet}
          media={source.media}
        />
      ))}
      {imageElement}
    </picture>
  );
}
