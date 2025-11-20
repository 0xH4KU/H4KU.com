# Lum.bio

_A file-system inspired portfolio built with React 19, TypeScript, and static content aggregation._

## Project Structure

```
lum.bio/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI primitives
│   │   │   └── LazyImage.tsx
│   │   ├── content/         # Content rendering logic
│   │   │   └── ContentView.tsx
│   │   ├── forms/           # Form components
│   │   │   └── ContactForm.tsx
│   │   ├── layout/          # Core layout components
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── FolderTreeItem.tsx
│   │   │   ├── SearchPanel.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Tooltip.tsx
│   │   └── overlay/         # Full-screen overlays
│   │       ├── Crosshair.tsx
│   │       └── Lightbox.tsx
│   ├── contexts/            # React Context providers
│   │   ├── NavigationContext.tsx
│   │   ├── SearchContext.tsx
│   │   ├── SidebarContext.tsx
│   │   ├── SortContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use100vh.ts
│   │   ├── useCrosshair.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useReducedMotion.ts
│   │   ├── useSidebar.ts
│   │   └── useWindowSize.ts
│   ├── utils/               # Pure utility functions
│   │   ├── frontmatter.ts   # Markdown parsing
│   │   ├── navigation.ts    # Navigation helpers
│   │   ├── searchNavigation.ts # Shared search selection handler
│   │   ├── secureConsole.ts # Console shims that survive minification
│   │   ├── sortHelpers.ts   # Sorting logic
│   │   └── urlHelpers.ts    # URL manipulation
│   ├── content/             # Static content data
│   │   ├── folders/         # Folder structure JSON
│   │   ├── pages/           # Page content JSON
│   │   ├── socials/         # Social links JSON
│   │   ├── images/          # Image metadata
│   │   └── _aggregated.json # Build-time aggregated data
│   ├── config/              # Application configuration
│   │   ├── constants.ts
│   │   └── contact.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── tests/               # Test utilities
│   │   ├── setup.ts
│   │   └── utils.tsx
│   ├── styles/              # Global styles
│   │   └── global.css
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── scripts/
│   ├── build-data.js        # Content aggregation script
│   └── cms.js               # Legacy CMS importer
├── public/                  # Static assets
│   ├── fonts/
│   ├── content/             # Original content source
│   ├── _redirects           # SPA routing config
│   └── robots.txt
├── .gitlab-ci.yml           # GitLab CI/CD pipeline
├── vite.config.ts           # Vite build configuration
├── vitest.config.ts         # Vitest test configuration
└── tsconfig.json            # TypeScript compiler config
```

## Architecture

### State Management

Context-based architecture with specialized providers:

- **NavigationContext** – Folder tree, current path, breadcrumbs with O(1) lookups
- **SearchContext** – Debounced search with pre-indexed content
- **ThemeContext** – Light/dark mode with system preference detection
- **SidebarContext** – Collapsible sidebar with persistence
- **SortContext** – Multi-criteria sorting (name, date, type)

### Data Pipeline

```
JSON files (src/content/*/)
  ↓
npm run build:data
  ↓
_aggregated.json
  ↓
Runtime import (no dynamic imports)
  ↓
Context providers
```

Build-time aggregation eliminates runtime glob imports and reduces bundle size.

### Navigation

- Custom NavigationContext built directly on the History API (no React Router dependency)
- Deep links: `/folder/path/to/item` and `/page/page-id`
- O(1) path lookups via Map-based indexing
- Persistent navigation state across reloads via URL parsing + context state hydration

### Performance Notes

- **Lazy image loading** – IntersectionObserver covers non-priority images; eager thumbs bypass the observer to avoid extra work.
- **Bounded search** – Results render in capped batches with “show more” pagination to keep single-letter queries fast.
- **CSS Modules** – Scoped styles that tree-shake cleanly.
- **Reduced motion** – Every animation variant respects `prefers-reduced-motion`.
- **Fonts** – `font-display: swap` with defined fallbacks.

## Integrity Verification

- `scripts/build-data.js` writes `_integrity` (FNV-1a) and `_integritySHA256` plus `_buildTime` into `src/content/_aggregated.json`.
- `npm run integrity:check` recomputes both hashes. Pass `-- --write` to update the stored values when you intentionally edit content JSON.
- `src/data/mockData.ts` validates the hashes at runtime; the UI surfaces the status so tamper warnings aren’t silent.
- Always run `npm run build:data` after changing anything under `src/content/` or after syncing with `npm run cms`, then commit the refreshed snapshot.
- More detail lives in [`docs/INTEGRITY.md`](docs/INTEGRITY.md).

### Accessibility Features

- WCAG 2.1 AA compliant
- Semantic HTML with ARIA labels
- Keyboard navigation for all interactive elements
- Skip links for main content
- Focus management in modal contexts
- Screen reader optimized markup

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19.2 |
| **Routing** | Custom NavigationContext (History API observers) |
| **Language** | TypeScript 5.4 (strict mode) |
| **Build Tool** | Vite 7 |
| **Styling** | CSS Modules + global tokens |
| **Animation** | Framer Motion (reduced-motion aware) |
| **Testing** | Vitest 4 + React Testing Library (95% global threshold) |
| **Linting** | ESLint + Prettier |
| **CI/CD** | GitLab CI + Cloudflare Pages |
| **Contact** | Server-side endpoint (`VITE_CONTACT_ENDPOINT`) |

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/cwlum/lum.bio.git
cd lum.bio
npm install
cp .env.example .env  # Configure VITE_CONTACT_ENDPOINT if needed
npm run dev
```

Development server runs at `http://localhost:5173`

#### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_CONTACT_ENDPOINT` | Server-side endpoint that handles contact form submissions. Defaults to `/api/contact` (Cloudflare Email Worker or Pages Function on same domain). |
| `VITE_CONTACT_TIMEOUT` | (Optional) Timeout in milliseconds for contact submissions. |
| `VITE_SENTRY_DSN` | (Optional) Enables production crash reporting via Sentry. |
| `VITE_APP_VERSION` | (Optional) Overrides the release tag reported to monitoring. |
| `VITE_APP_ENV` | (Optional) Sets the monitoring environment label (`prod`, `staging`, etc.). |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build orchestrator (CMS → fingerprint → Vite) |
| `npm run build:fast` | Skip CMS + fingerprint for quick UI builds (`--skip=cms,fingerprint`) |
| `npm run build:data` | Aggregate content JSON into `_aggregated.json` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Generate coverage report (95% global threshold) |
| `npm run test:ui` | Open Vitest UI dashboard |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix auto-fixable lint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Verify TypeScript types |
| `npm run deps:prune` | Remove extraneous packages (runs after install) |
| `npm run size` | Check bundle size against limits |
| `npm run size:analyze` | Detailed bundle analysis |
| `npm run integrity:check` | Verify or update `_aggregated.json` checksums |
| `npm run ci` | Run all CI checks locally |
| `npm run ci:quality` | Run quality checks (lint, format, types) |
| `npm run ci:coverage` | Run tests with coverage reporting |
| `npm run ci:security` | Run security scans |
| `npm run ci:bundle` | Build and check bundle size |

### Content Management

Content lives in committed JSON under `src/content/` (currently three top-level folders with three sample works plus About/Contact pages). The CMS importer (`npm run cms`) can regenerate these JSON files from `public/content/` and `npm run build:data` bundles them into `_aggregated.json` with integrity hashes.

- `folders/*.json` – Folder hierarchy and metadata
- `pages/*.json` – Text content
- `images/*.json` – Image/work metadata (thumb + full URLs under `public/content/`)
- `socials/*.json` – Social links

After editing any of the above, run `npm run build:data` and commit the refreshed `_aggregated.json`.

## Testing

- Runner: Vitest 4 + Testing Library (jsdom)
- Suite size: 25 spec files / ~273 tests as of Nov 2025
- Coverage: 95% global thresholds for lines/branches/functions/statements

Focus areas:
- Context providers (navigation, search, sidebar, theme)
- Hooks with side effects (storage, focus trapping, debounced resize)
- Utilities (navigation maps, integrity hashing, URL helpers)
- Layout behaviors (search overlay, status bar, keyboard flows)

Principles: prefer behavior over implementation, keep mocks minimal, avoid snapshots, and keep the suite fast enough to run with every commit.

## Deployment

### Cloudflare Pages

Cloudflare Pages deployments run out of the box via the bundled `wrangler.toml`:

```bash
npm install
npm run build
npx wrangler pages deploy --project-name lum-bio dist
```

- Adjust `pages_build_output_dir` or `name` inside `wrangler.toml` if your project slug differs.
- Set `VITE_CONTACT_ENDPOINT` (and any optional vars) through the Cloudflare Pages dashboard or by editing the `[vars]` block before deploying.
- Security headers (CSP, HSTS, Permissions-Policy, etc.) live in `public/_headers`. Update the `connect-src` directive there if your contact endpoint uses a different domain.

`vite-plugin-sitemap` runs during `vite build`, generating a fresh `dist/sitemap.xml` from the aggregated content so you no longer need to maintain a static `public/sitemap.xml`.

### CI/CD Pipeline

GitLab CI automatically runs on every push:

1. **Lint** – ESLint + Prettier
2. **Type Check** – TypeScript compilation
3. **Tests** – Full Vitest suite
4. **Build Data** – Aggregate content
5. **Build** – Production bundle
6. **Deploy** – Cloudflare Pages (main branch only)

Build artifacts retained for 7 days.

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** – Architecture deep dive
- **[TESTING.md](./TESTING.md)** – Testing guidelines
- **[CONTENT_GUIDE.md](./CONTENT_GUIDE.md)** – Content authoring guide
- **[docs/INTEGRITY.md](./docs/INTEGRITY.md)** – Checksum workflow
- **[docs/ANTI_THEFT_PROTECTION.md](./docs/ANTI_THEFT_PROTECTION.md)** – Anti-tamper layers
- **[docs/CI_GUIDE.md](./docs/CI_GUIDE.md)** – Combined CI/CD workflow and badge reference

## License

This project is licensed under the **Lum.bio Personal Source License (LPSL-1.0)**.

**Summary:** Source code is available for learning and reference. Deployment, redistribution, and commercial use are prohibited. Content and artwork remain exclusive to the author.

See [LICENSE.md](./LICENSE.md) for full terms.

## Contact

For questions, collaboration, or licensing inquiries:

- **Email:** hi@lum.bio
- **Issues:** [GitHub](https://github.com/cwlum/lum.bio/issues) / [GitLab](https://gitlab.com/lummuu/lum.bio/-/issues)

### Cloudflare Email Worker setup (recommended)

Deploy a CF Worker (or Pages Function) that accepts `POST /api/contact` and sends email using the Email Worker binding. Keeping it on the same domain keeps CSP/CORS simple.

1. Map the Worker route to `/api/contact` on your Pages domain (or use `https://<subdomain>.workers.dev/contact`).
2. Set `VITE_CONTACT_ENDPOINT` accordingly; default `/api/contact` already works for same-domain routes.
3. If you use a workers.dev hostname, CSP already allows `https://*.workers.dev`.
4. Optional: adjust `VITE_CONTACT_TIMEOUT` (ms) to your SLA.

---

**Note:** This is a personal portfolio project. The architecture and implementation patterns are shared for educational purposes, not as a template for cloning.
