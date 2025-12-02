# Development Guide

_Architecture reference for contributors extending Lum.bio without regressing the core experience._

## 1. System Overview

| Concern      | Implementation                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Rendering    | React 19 + Vite 7 with CSS Modules for scoped styling                                                                            |
| Global State | Context providers for navigation, theme, search UI/results, sorting, and sidebar preferences                                     |
| Data Source  | Static JSON under `src/content/` aggregated at build time (`npm run build:data`) into `src/content/_aggregated.json`             |
| Routing      | Custom NavigationContext built on the History API (`/`, `/folder/<path>`, `/page/<id>`) with manual URL ↔ state synchronisation |
| Animations   | Framer Motion variants with reduced-motion fallbacks                                                                             |
| Assets       | Everything under `public/` (images, gifs, fonts) served verbatim by Vite                                                         |
| Styling      | CSS Modules with CSS custom properties for dynamic styles (CSP-compliant, minimal inline styles)                                |

### Data Flow

```
public/content/**/* (source assets)
        │
        ├─► npm run cms          # optional: regenerate src/content/*.json
        │
        └─► src/content/**/*     # committed JSON + assets
                │
                ├─► npm run build:data   # bundle into _aggregated.json with hashes
                │
                └─► src/data/mockData.ts # runtime parser + integrity check
                          │
                          └─► Contexts/hooks/components render tree
```

`npm run build` orchestrates CMS → fingerprint → Vite. It does **not** regenerate `_aggregated.json`; run `npm run build:data` after content edits and commit the snapshot so hashes stay in sync.

## 2. Key Modules

### Navigation Context (`src/contexts/NavigationContext.tsx`)

- Holds the current path (`['home', ...]`), active view, and lightbox state.
- Uses `buildNavigationMap` from `src/utils/navigation.ts` to create `byId`, `byPath`, and `pathById` maps (O(1) lookups).
- Subscribes to `popstate` and writes via `window.history.pushState`, so URLs remain the single source of truth without React Router.
- Provides helpers for breadcrumbs, back/forward behaviour, and lightbox navigation.

### Search Context (`src/contexts/SearchContext.tsx`)

- Split into **UI state** (open/close, query string) and **data state** (pre-indexed folders/pages/works).
- Debounces user input, lowers everything to lowercase, and returns light-weight `SearchResult` objects.
- Consumers can subscribe to UI-only (`useSearchUI`) or data-only (`useSearchResults`) hooks to avoid unnecessary renders.

### Sidebar Context (`src/contexts/SidebarContext.tsx`)

- Stores width, expanded folders, and pinned items in localStorage.
- Clamps the persisted width between `SIDEBAR_CONFIG.MIN/MAX_WIDTH` so corrupted storage (or manual edits) never break the layout.
- Handles media queries for the responsive breakpoint and exposes open/close helpers for the layout shell.

### Theme Context (`src/contexts/ThemeContext.tsx`)

- Reads system preference, stores explicit overrides, and updates `data-theme`, `color-scheme`, and two `theme-color` meta tags.
- The inline script in `index.html` only sets `data-theme` before hydration to avoid flashes.

### LazyImage (`src/components/common/LazyImage.tsx`)

- Uses a shared IntersectionObserver for non-priority images; priority items load eagerly.
- Optional `srcSet`/`sizes` support; errors fall back to an inline placeholder to preserve layout.
- Implements data-attribute based styling (`data-loaded`, `data-priority`) instead of inline styles for CSP compliance.

### Data Parser (`src/data/mockData.ts`)

- Reads from `_aggregated.json`, normalises folder relationships, attaches works/pages, and sorts everything with deterministic rules.
- `buildNavigationMap` consumes the resulting folder tree for O(1) lookups elsewhere.

### Integrity Verification Pipeline

- `scripts/build-data.js` writes `_integrity` (FNV-1a) and `_integritySHA256` plus `_buildTime` when aggregating content.
- `scripts/check-integrity.ts` drives `npm run integrity:check`; `-- --write` updates hashes for intentional content changes.
- `src/data/mockData.ts` recomputes both hashes at runtime; the layout surfaces the status so tamper warnings are visible.
- Tests cover hash verification and tamper UI in `src/components/layout/__tests__/StatusBar.test.tsx`.

### Monitoring & Error Handling

- `src/services/monitoring.ts` wraps Sentry initialisation; set `VITE_SENTRY_DSN` to enable crash reporting (the app gracefully no-ops when it’s missing).
- `src/components/common/ErrorBoundary.tsx` reports every error via the monitoring service, shows a friendlier fallback with recovery steps, and exposes a copy-to-clipboard crash report that includes the reference code.
- Each reference code is sent as a Sentry tag so the support address (`hi@lum.bio`) can correlate user reports with telemetry.

## 3. Performance Notes

| Optimization                | Why it matters                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Search provider split       | Typing in the search overlay no longer re-renders the entire app shell.                              |
| Navigation map              | Breadcrumbs, back navigation, and sidebar auto-expansion are constant time regardless of tree depth. |
| Shared IntersectionObserver | Hundreds of thumbnails can exist without spawning hundreds of observers.                             |
| Build-time data aggregation | Replaces four eager `import.meta.glob` calls with a single JSON import.                              |
| Theme init redesign         | Removes redundant `getComputedStyle` calls and meta-tag cloning on every toggle.                     |

When profiling, pay close attention to `NavigationContext` (URL synchronisation), `ContentView` (sorting + motion), and `SearchPanel` (keyboard flows). All three already consider reduced-motion preferences.

## 4. Build & Deployment

- **Local build** – `npm run build` runs CMS sync (unless skipped), injects fingerprints, then runs `vite build`. Use `npm run build:fast` to skip CMS/fingerprint when iterating on UI.
- **Content aggregation** – Run `npm run build:data` after changing `src/content/**` (or after `npm run cms`), then commit the refreshed `_aggregated.json`.
- **CI** – `npm run ci` runs the full pipeline: quality → coverage (90% lines/functions/statements, 85% branches) → security scan → deps freshness (`ci:deps`) → license audit (`ci:license`) → build + bundle/perf budget check.
- **Cloudflare Pages** – SPA redirect handled by `public/_redirects`; configure `VITE_CONTACT_ENDPOINT` via Pages settings.

## 5. Extending the Project

1. **Add content** – Modify JSON in `src/content`, run `npm run build:data`, and commit both the source files and `_aggregated.json`.
2. **Add UI state** – Prefer a dedicated context + hook pair so consumers can subscribe to only what they need.
3. **Add animations** – Provide reduced-motion variants and keep transitions short (<300 ms) to match the existing interaction style.
4. **Add routing** – Update `NavigationContext` so new sections remain in sync with URLs and breadcrumbs; remember to update `_redirects` if you add top-level routes.

For deeper testing guidance or CI instructions, see `TESTING.md`.
