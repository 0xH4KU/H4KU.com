/**
 * Application-wide constants and configuration values
 */

/**
 * Breakpoints for responsive design (in pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET_SM: 768,
  TABLET_LG: 1024,
  DESKTOP: 1440,
} as const;

/**
 * Debounce delays for various operations (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
  INPUT: 200,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
} as const;

/**
 * Theme color values
 */
export const THEME_COLORS = {
  LIGHT: {
    SURFACE: '#e8e8e8',
    BACKGROUND: '#f5f5f5',
  },
  DARK: {
    SURFACE: '#0f0f0f',
    BACKGROUND: '#1a1a1a',
  },
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'lum.bio.theme',
  SIDEBAR_WIDTH: 'lum.bio.sidebar.width',
  EXPANDED_FOLDERS: 'lum.bio.sidebar.expanded',
  PINNED_ITEMS: 'lum.bio.sidebar.pinned',
} as const;

/**
 * Sidebar configuration
 */
export const SIDEBAR_CONFIG = {
  MIN_WIDTH: 200,
  MAX_WIDTH: 340,
  DEFAULT_WIDTH: 260,
  MOBILE_BREAKPOINT: BREAKPOINTS.TABLET_SM,
} as const;

/**
 * Image loading configuration
 */
export const IMAGE_CONFIG = {
  LAZY_LOAD_ROOT_MARGIN: '150px',
  LAZY_LOAD_THRESHOLD: 0.01,
  /** Default sizes attribute for responsive images in grid view */
  GRID_SIZES: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  /** Thumbnail width for list/grid views (px) */
  THUMBNAIL_WIDTH: 400,
  /** Full image max width (px) */
  FULL_WIDTH: 1920,
  /** Number of images to load with high priority (for LCP optimization) */
  PRIORITY_COUNT: 2,
} as const;

/**
 * Breadcrumb configuration
 */
export const BREADCRUMB_CONFIG = {
  MAX_SEGMENTS: {
    MOBILE: 2,
    TABLET_SM: 3,
    TABLET_LG: 4,
    DESKTOP: 6,
  },
} as const;
