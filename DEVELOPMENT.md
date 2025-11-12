# Development Guide

This document explains how Lum.bio is put together under the hood. It is intended for engineers who want to reason about the architecture, understand the trade-offs we made, and extend the codebase without breaking the site’s core experience.

## 1. System Overview

| Concern | Implementation |
| --- | --- |
| Rendering | React 19 + Vite 7 with CSS Modules for scoped styling |
| Global State | Context providers for navigation, theme, search UI/results, sorting, and sidebar preferences |
| Data Source | Static JSON under `src/content/` aggregated at build time (`npm run build:data`) into `src/content/_aggregated.json` |
| Routing | React Router (`/`, `/folder/<path>`, `/page/<id>`) with URL ↔ state synchronisation |
| Animations | Framer Motion variants with reduced-motion fallbacks |
| Assets | Everything under `public/` (images, gifs, fonts) served verbatim by Vite |

### Data Flow

```
src/content/**/*  ──►  npm run build:data  ──►  src/content/_aggregated.json
                                         │
                                         ▼
                              src/data/mockData.ts (runtime parser)
                                         │
                                         ▼
                             Contexts/hooks/components render tree
```

The aggregation step keeps the runtime bundle small and guarantees deterministic content snapshots for every build. If you forget to run `npm run build:data`, `npm run build` will do it for you.

## 2. Key Modules

### Navigation Context (`src/contexts/NavigationContext.tsx`)
- Holds the current path (`['home', ...]`), active view, and lightbox state.
- Uses `buildNavigationMap` from `src/utils/navigation.ts` to create `byId`, `byPath`, and `pathById` maps (O(1) lookups).
- Synchronises URL changes via React Router’s `useNavigate`/`useLocation`.
- Provides helpers for breadcrumbs, back/forward behaviour, and lightbox navigation.

### Search Context (`src/contexts/SearchContext.tsx`)
- Split into **UI state** (open/close, query string) and **data state** (pre-indexed folders/pages/works).
- Debounces user input, lowers everything to lowercase, and returns light-weight `SearchResult` objects.
- Consumers can subscribe to UI-only (`useSearchUI`) or data-only (`useSearchResults`) hooks to avoid unnecessary renders.

### Sidebar Context (`src/contexts/SidebarContext.tsx`)
- Stores width, expanded folders, and pinned items in localStorage.
- Handles media queries for the responsive breakpoint and exposes open/close helpers for the layout shell.

### Theme Context (`src/contexts/ThemeContext.tsx`)
- Reads system preference, stores explicit overrides, and updates `data-theme`, `color-scheme`, and two `theme-color` meta tags.
- The inline script in `index.html` only sets `data-theme` before hydration to avoid flashes.

### LazyImage (`src/components/common/LazyImage.tsx`)
- Registers every thumbnail with a module-level IntersectionObserver using thresholds from `IMAGE_CONFIG`.
- Supports optional `srcSet` / `sizes` and falls back to a transparent pixel until the observer resolves.
- On errors, swaps in an inline SVG so grids keep their layout.

### Data Parser (`src/data/mockData.ts`)
- Reads from `_aggregated.json`, normalises folder relationships, attaches works/pages, and sorts everything with deterministic rules.
- `buildNavigationMap` consumes the resulting folder tree for O(1) lookups elsewhere.

## 3. Performance Notes

| Optimization | Why it matters |
| --- | --- |
| Search provider split | Typing in the search overlay no longer re-renders the entire app shell. |
| Navigation map | Breadcrumbs, back navigation, and sidebar auto-expansion are constant time regardless of tree depth. |
| Shared IntersectionObserver | Hundreds of thumbnails can exist without spawning hundreds of observers. |
| Build-time data aggregation | Replaces four eager `import.meta.glob` calls with a single JSON import. |
| Theme init redesign | Removes redundant `getComputedStyle` calls and meta-tag cloning on every toggle. |

When profiling, pay close attention to `NavigationContext` (URL synchronisation), `ContentView` (sorting + motion), and `SearchPanel` (keyboard flows). All three already consider reduced-motion preferences.

## 4. Build & Deployment

- **Local build** – `npm run build` runs the data aggregator then `vite build`.
- **CI** – GitLab pipeline runs lint → type-check → tests → build. Artifacts are uploaded so Cloudflare Pages can deploy from a known-good bundle.
- **Cloudflare Pages** – SPA redirect handled by `public/_redirects`; EmailJS keys provided via environment variables.

## 5. Extending the Project

1. **Add content** – Modify JSON in `src/content`, run `npm run build:data`, and commit both the source files and `_aggregated.json`.
2. **Add UI state** – Prefer a dedicated context + hook pair so consumers can subscribe to only what they need.
3. **Add animations** – Provide reduced-motion variants and keep transitions short (<300 ms) to match the existing interaction style.
4. **Add routing** – Update `NavigationContext` so new sections remain in sync with URLs and breadcrumbs; remember to update `_redirects` if you add top-level routes.

For deeper testing details or CI instructions, see `TESTING.md` and `GITLAB_CI_SETUP.md`.
