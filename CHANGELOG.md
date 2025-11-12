# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2025-11-12] - Performance & Documentation Refresh

### Added
- **Navigation map cache** – `buildNavigationMap` now materialises `byId`, `pathById`, and `byPath` maps so every folder lookup (breadcrumbs, sidebar expansion, back navigation) is constant time.
- **Data aggregation script** – `scripts/build-data.js` consolidates `src/content` into a single `_aggregated.json`, eliminating four eager glob imports and shrinking the initial bundle.
- **Lazy image responsive metadata** – `LazyImage` accepts `sizes/srcSet` and centralises an IntersectionObserver so all thumbnails share one observer instance.
- **Documentation suite** – README, Development, Testing, Setup, and CI guides were rewritten for a public audience; redundant contributor/CMS docs were removed.

### Changed
- **Search context** – split UI state and result data providers, added memoised indices, and prevented unnecessary app-wide renders when typing.
- **Theme initialisation** – the inline script now sets only `data-theme` pre-hydration while `ThemeContext` updates meta tags, removing duplicate `getComputedStyle` cycles.
- **Build command** – `npm run build` now runs `npm run build:data && vite build` to guarantee the aggregated dataset is fresh.

### Fixed
- **Image loading** – caching the observer and using project-wide thresholds prevents the previous per-image observer leaks.
- **Tests & CI** – suite expanded to 180 specs covering the new data pipeline, nav map utilities, and context behaviour.

### Removed
- Contributor/agent/CMS markdown guides that were intended for private handoffs have been deleted to keep the public repo focused on architecture and delivery.

## [Unreleased] - 2025-11-06

### Added

#### 1. Lightbox Image Navigation
- **Navigation Controls**: Added previous/next arrow buttons to navigate between images in a gallery
- **Keyboard Support**: Added keyboard shortcuts (←/→ arrows) for image navigation, ESC to close
- **Image Counter**: Display current image position (e.g., "3 / 10") in lightbox info bar
- **Gallery Context**: Lightbox now tracks the full gallery of images for seamless browsing
- **Accessibility**: Added `aria-label` attributes to navigation buttons
- **Visual Feedback**: Added hover and focus states with smooth transitions

#### 2. Persistent Sidebar Width
- **localStorage Integration**: Sidebar width preference is now saved to localStorage
- **Automatic Restoration**: User's preferred sidebar width is restored on page reload
- **Seamless Experience**: Maintains width between 180px-320px as configured

#### 3. URL Routing with React Router
- **Deep Linking**: All pages and folders now have shareable URLs
  - Home: `/`
  - Folders: `/folder/{folderId}` or `/folder/{parentId}/{childId}`
  - Pages: `/page/{pageId}`
- **Browser Navigation**: Back/forward browser buttons now work correctly
- **URL Synchronization**: Application state syncs with URL changes
- **Bookmarkable**: Users can bookmark specific pages and folders

#### 4. Enhanced Search Keyboard Navigation
- **Arrow Key Navigation**: Use ↑/↓ to navigate through search results
- **Enter to Select**: Press Enter to open the currently selected result
- **Visual Selection**: Selected search result is highlighted with primary color
- **Reset on Change**: Selection resets when search query changes

#### 5. Accessibility Improvements
- **Focus Indicators**: Added visible focus outlines (2px teal border) for all interactive elements
- **Skip Link**: Added "Skip to main content" link for keyboard users
- **ARIA Attributes**: Crosshair overlay hidden from screen readers with `aria-hidden="true"`
- **Main Content Landmark**: Added `role="main"` and `id="main-content"` to content area
- **Button Labels**: Added descriptive `aria-label` to navigation buttons

#### 6. Reduced Motion Support
- **Media Query Detection**: Respects `prefers-reduced-motion` user preference
- **Conditional Animations**: All framer-motion animations are disabled when reduced motion is preferred
- **CSS Fallback**: Global CSS rules ensure instant transitions for reduced motion
- **Hover Effects**: Scale and transform animations respect motion preferences

#### 7. Performance Optimizations
- **Search Debouncing**: 300ms debounce on search input to reduce unnecessary computations
- **Optimized Re-renders**: Search results only update after debounce delay
- **Improved UX**: Smoother typing experience in search field

#### 8. Image Error Handling
- **Graceful Failures**: Images that fail to load show a friendly fallback message
- **SVG Placeholder**: Clean "Image failed to load" placeholder with proper styling
- **Error State Management**: Proper error state tracking prevents infinite retry loops
- **Visual Consistency**: Fallback maintains layout structure

### Changed

#### Navigation Updates
- **Removed Forward Button**: Eliminated non-functional forward navigation button
  - Users can rely on browser's native forward button
  - Cleaner UI with fewer inactive controls
  - Reduced user confusion

#### Animation Behavior
- **Adaptive Animations**: All motion effects now check for reduced motion preference
- **Performance**: Animations skip when not needed, improving performance for users who prefer reduced motion

### Fixed

- **Type Safety**: Tightened TypeScript types across navigation and lightbox contexts
- **Memory Leaks**: Proper cleanup of event listeners in all components
- **Sidebar State**: Sidebar width now persists correctly across sessions
- **Search Focus**: Search input properly receives focus when panel opens
- **Keyboard Traps**: Improved keyboard navigation flow throughout the application

### Technical Improvements

- **New Hooks**:
  - `useReducedMotion`: Detects user's motion preference
  - `useDebounce`: Generic debouncing utility
- **Context Updates**:
  - `NavigationContext`: Enhanced with URL routing support and lightbox gallery management
  - `SearchContext`: Added debouncing for search queries
- **Component Updates**:
  - `LazyImage`: Now handles errors and displays fallback
  - `Lightbox`: Complete navigation system with gallery support
  - `SearchPanel`: Full keyboard navigation support
  - `ContentView`: Respects reduced motion preferences
  - `Crosshair`: Hidden from assistive technologies

### Developer Experience

- **Better URL Structure**: Clean, RESTful URLs for all routes
- **Enhanced TypeScript**: Improved type definitions for navigation and search
- **Code Organization**: Better separation of concerns with custom hooks
- **Accessibility First**: All new features include proper ARIA attributes

---

## Summary

This update significantly enhances the user experience with 10 major improvements:

1. ✅ **Lightbox Navigation** - Browse images without closing the lightbox
2. ✅ **Persistent Sidebar** - Your layout preferences are remembered
3. ✅ **URL Routing** - Share and bookmark any page
4. ✅ **Search Navigation** - Navigate results with keyboard
5. ✅ **Accessibility** - Focus indicators and skip links
6. ✅ **Reduced Motion** - Respects motion preferences
7. ✅ **Removed Clutter** - Eliminated non-functional forward button
8. ✅ **Search Performance** - Debounced search for better performance
9. ✅ **Error Handling** - Graceful image loading failures
10. ✅ **Better UX** - Smooth transitions and visual feedback throughout

The application is now more accessible, performant, and user-friendly while maintaining its clean, minimalist aesthetic.
