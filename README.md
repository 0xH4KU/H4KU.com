# Lum.bio Portfolio

Lum.bio is a single-page, file-system inspired portfolio experience. It combines a tactile desktop metaphor (folders, text files, and galleries) with modern React tooling, accessibility-first design, and a fully static delivery model that runs anywhere a CDN can serve HTML.

## Experience Highlights

- **Spatial navigation** – Hierarchical folder tree with persistent width, context-aware breadcrumbs, and keyboard shortcuts for every action.
- **Unified search** – Debounced, pre-indexed search that surfaces folders, text notes, and artwork in milliseconds without blocking the UI.
- **Gallery workflow** – Lazy-loaded thumbnails, shared IntersectionObserver, and a lightbox that supports keyboard navigation, counters, and metadata overlays.
- **Accessibility built in** – Skip links, focus rings, ARIA labeling, reduced-motion fallbacks, and screen-reader-friendly semantics throughout.
- **Designer tools** – Pixel crosshair overlay, responsive grid, and theme-aware chroming for reviewing artwork in both light and dark environments.

## Architecture at a Glance

| Layer | Description |
| --- | --- |
| **Rendering** | React 19 + Vite 7 with CSS Modules for scoped styling |
| **State** | Context providers for theme, navigation, sorting, search UI/results, and sidebar preferences |
| **Data** | Static JSON content authored under `src/content/` and aggregated at build time into `src/content/_aggregated.json` via `npm run build:data` |
| **Navigation** | React Router with deep links for folders (`/folder/...`) and text entries (`/page/...`); O(1) lookup maps keep breadcrumbs/back navigation instant |
| **Media** | LazyImage wraps the shared IntersectionObserver, optional `srcset` metadata, and graceful error states |
| **CI/CD** | GitLab CI validates lint, type, and 180 automated tests before Cloudflare Pages builds and deploys |

## Technology Stack

| Category | Tooling |
| --- | --- |
| UI Framework | React 19.2, React Router 7.9 |
| Language & Build | TypeScript 5.4 (strict) + Vite 7 |
| Styling | CSS Modules + global design tokens |
| Animation | Framer Motion with reduced-motion-aware variants |
| Testing | Vitest 4 + React Testing Library (180 automated specs) |
| Email | EmailJS (lazy-loaded to keep the initial bundle lean) |

## Getting Started

```bash
git clone git@gitlab.com:lummuu/lum.bio.git
cd lum.bio
npm install
npm run dev         # http://localhost:5173
```

Common scripts:

| Command | Purpose |
| --- | --- |
| `npm run build` | Runs `npm run build:data` then produces the production bundle |
| `npm run build:data` | Aggregates `src/content/**/*` JSON into `src/content/_aggregated.json` |
| `npm run lint` / `npm run lint:fix` | ESLint + Prettier checks |
| `npm run type-check` | TypeScript `--noEmit` verification |
| `npm run test:run` | Executes the full Vitest suite once (used in CI) |
| `npm run preview` | Serves the built `dist/` bundle locally |

## Data & Content Pipeline

1. Author or edit JSON entries under `src/content/{folders,works,pages,socials}`. Each file is versioned alongside the code.
2. Run `npm run build:data` (or simply `npm run build`) to regenerate `src/content/_aggregated.json`. This single artifact replaces four eager `import.meta.glob` calls and keeps the runtime bundle lean.
3. Static assets (illustrations, gifs, fonts) live under `public/` so Vite can serve them verbatim.
4. `scripts/cms.js` remains available for bulk imports from `public/content/` if you prefer that workflow, but the repository-first JSON approach is the default.

## Quality & Testing

- **180 automated tests** cover hooks, utilities, contexts, and layout behaviors. The suite runs in under 2 seconds on CI.
- **Tooling**: Vitest + React Testing Library with jsdom, snapshot-free assertions, and helpers in `src/tests/utils.tsx`.
- **Philosophy**: write behavior-driven tests (Arrange → Act → Assert), mock external services sparingly, and target 80%+ coverage for new modules.

```bash
npm test             # watch mode
npm run test:run     # single CI run
npm run test:coverage
npm run test:ui      # interactive dashboard
```

## Deployment

| Target | Configuration |
| --- | --- |
| **Cloudflare Pages** | Build command `npm run build`, output `dist`, environment vars for EmailJS (`VITE_EMAILJS_*`). `_redirects` ensures SPA routing. |
| **Manual (Wrangler)** | `npm run build && npx wrangler pages deploy dist` |

The GitLab pipeline mirrors the local workflow: lint → type-check → tests → `npm run build:data` → `vite build`. Artifacts are retained for 7 days to aid debugging.

## Documentation Map

- **[CHANGELOG.md](./CHANGELOG.md)** – human-readable release notes.
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** – architecture deep dive, context/hook responsibilities, and performance techniques.
- **[TESTING.md](./TESTING.md)** – detailed guidance for authoring and running tests.
- **[SETUP.md](./SETUP.md)** – operations playbook for local dev, content editing, EmailJS, and Cloudflare Pages.
- **[GITLAB_CI_SETUP.md](./GITLAB_CI_SETUP.md)** – CI pipeline stages, variables, and troubleshooting.
- **[OPTIMIZATION_PROGRESS.md](./OPTIMIZATION_PROGRESS.md)** – performance backlog and resolutions for posterity.

## Ethical Use & License

Lum.bio is intentionally source-available so you can learn from the architecture, not to
clone the production experience. By using this repository you agree to the
[Lum.bio Personal Source License](./LICENSE.md), which allows local evaluation and
reference but forbids redeploying the UI, reusing the artwork/JSON content, or repackaging
the project in commercial products. For talks, articles, or other uses outside those bounds,
email `hi@lum.bio`.

Questions? Open an issue on GitLab or reach out directly to `hi@lum.bio`.
