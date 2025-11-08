import React, { useMemo } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';
import { BREAKPOINTS, BREADCRUMB_CONFIG } from '@/config/constants';
import styles from './TopBar.module.css';

interface BreadcrumbSegment {
  id: string;
  label: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  onSelect: (index: number) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ segments, onSelect }) => {
  const { width } = useWindowSize();

  // Calculate how many segments to show based on screen width
  const visibleSegments = useMemo(() => {
    if (!width) return segments;

    const segmentCount = segments.length;
    if (segmentCount <= 2) return segments;

    // Determine max segments based on screen width
    let maxSegments: number;
    if (width < BREAKPOINTS.MOBILE) {
      maxSegments = BREADCRUMB_CONFIG.MAX_SEGMENTS.MOBILE;
    } else if (width < BREAKPOINTS.TABLET_SM) {
      maxSegments = BREADCRUMB_CONFIG.MAX_SEGMENTS.TABLET_SM;
    } else if (width < BREAKPOINTS.TABLET_LG) {
      maxSegments = BREADCRUMB_CONFIG.MAX_SEGMENTS.TABLET_LG;
    } else {
      maxSegments = BREADCRUMB_CONFIG.MAX_SEGMENTS.DESKTOP;
    }

    if (segmentCount <= maxSegments) {
      return segments;
    }

    // Truncate: always show first (home) and last few segments
    const result: Array<BreadcrumbSegment | 'ellipsis'> = [];
    result.push(segments[0]); // Always show home

    // Calculate how many segments to show after ellipsis
    // Reserve 1 for home, 1 for ellipsis, rest for last segments
    const lastSegmentsCount = Math.max(1, maxSegments - 2);

    // Get last segments, but skip segments that would overlap with home
    const startIndex = Math.max(1, segmentCount - lastSegmentsCount);
    const lastSegments = segments.slice(startIndex);

    // Only add ellipsis if we're actually skipping segments
    if (startIndex > 1) {
      result.push('ellipsis');
    }

    result.push(...lastSegments);

    return result;
  }, [segments, width]);

  return (
    <div className={styles.breadcrumb}>
      {visibleSegments.map(item => {
        if (item === 'ellipsis') {
          return (
            <React.Fragment key="ellipsis">
              <span className={styles['breadcrumb-sep']}>/</span>
              <span
                className={styles['breadcrumb-ellipsis']}
                title="Path truncated"
              >
                ...
              </span>
            </React.Fragment>
          );
        }

        const segment = item as BreadcrumbSegment;
        const originalIndex = segments.findIndex(s => s.id === segment.id);
        const isActive = originalIndex === segments.length - 1;
        const isFirst = originalIndex === 0;

        return isFirst ? (
          <button
            key={segment.id}
            type="button"
            className={styles['breadcrumb-link']}
            onClick={() => onSelect(originalIndex)}
            disabled={isActive}
            aria-current={isActive ? 'page' : undefined}
          >
            lum.bio
          </button>
        ) : (
          <React.Fragment key={`${segment.id}-${originalIndex}`}>
            <span className={styles['breadcrumb-sep']}>/</span>
            <button
              type="button"
              className={styles['breadcrumb-link']}
              onClick={() => onSelect(originalIndex)}
              disabled={isActive}
              aria-current={isActive ? 'page' : undefined}
              title={segment.label}
            >
              {segment.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
