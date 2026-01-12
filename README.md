# H4KU.COM

_A file-system inspired portfolio built with React 19, TypeScript, and static content aggregation._

## Project Structure

```
H4KU.COM/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI primitives
│   │   │   └── LazyImage.tsx
│   │   ├── content/         # Content rendering logic
│   │   │   └── ContentView.tsx
│   │   ├── forms/           # Form components
│   │   │   ├── ContactForm.tsx
│   │   │   └── ContactVerify.tsx
│   │   ├── layout/          # Core layout components
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── FolderTreeItem.tsx
│   │   │   ├── SearchPanel.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarFooter.tsx
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
│   │   ├── useDeferredLoading.ts
│   │   ├── useInertFallback.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useReducedMotion.ts
│   │   ├── useSidebar.ts
│   │   ├── useSidebarResize.ts
│   │   └── useWindowSize.ts
│   ├── utils/               # Pure utility functions
│   │   ├── color.ts         # Color manipulation utilities
│   │   ├── frontmatter.ts   # Markdown parsing
│   │   ├── functional.ts    # Functional programming helpers
│   │   ├── navigation.ts    # Navigation helpers
│   │   ├── searchNavigation.ts # Shared search selection handler
│   │   ├── secureConsole.ts # Console shims that survive minification
│   │   ├── sortHelpers.ts   # Sorting logic
│   │   ├── typeGuards.ts    # Runtime type guards
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
public/content/homepage/**/* (source assets)
  ↓ npm run cms          # regenerates JSON + runs build:data automatically
src/content/{folders,images,pages,socials}/*.json
  ↓ npm run build:data   # writes _aggregated.json + integrity hashes (also run by npm run cms and npm run build)
src/content/_aggregated.json
  ↓
Runtime import (no dynamic imports)
  ↓
Context providers
```

`npm run build` orchestrates CMS → build-data → fingerprint → Vite → inline-critical. Build-time aggregation eliminates runtime glob imports and reduces bundle size.

### Navigation

- Custom NavigationContext built directly on the History API (no React Router dependency)
- Deep links: `/folder/path/to/item` and `/page/page-id`
- O(1) path lookups via Map-based indexing
- Persistent navigation state across reloads via URL parsing + context state hydration

### Performance Notes

- **Lazy image loading** – IntersectionObserver covers non-priority images; eager thumbs bypass the observer to avoid extra work.
- **Bounded search** – Results render in capped batches with "show more" pagination to keep single-letter queries fast.
- **CSS Modules** – Scoped styles that tree-shake cleanly.
- **CSS Variables for dynamic styles** – All positioning and dynamic styling uses CSS custom properties instead of inline styles for better CSP compliance.
- **Reduced motion** – Every animation variant respects `prefers-reduced-motion`.
- **Fonts** – `font-display: swap` with defined fallbacks.

## Integrity Verification

- `scripts/build-data.js` writes `_integrity` (FNV-1a) and `_integritySHA256` plus `_buildTime` into `src/content/_aggregated.json`.
- `npm run integrity:check` recomputes both hashes. Pass `-- --write` to update the stored values when you intentionally edit content JSON.
- `src/data/mockData.ts` validates the hashes at runtime and throws before render on mismatch (StatusBar shows the checksum only when valid).
- Always run `npm run cms` (or at minimum `npm run build:data`) after changing anything under `public/content/` or `src/content/`, then commit the refreshed snapshot.
- For more details, you can directly refer to the comments in the code and `src/data/mockData.ts`。

### Accessibility Features

- WCAG 2.1 AA compliant
- Semantic HTML with ARIA labels
- Keyboard navigation for all interactive elements
- Skip links for main content
- Focus management in modal contexts
- Screen reader optimized markup

## Technology Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| **Framework**  | React 19.2                                              |
| **Routing**    | Custom NavigationContext (History API observers)        |
| **Language**   | TypeScript 5.6 (strict mode)                            |
| **Build Tool** | Vite 7                                                  |
| **Styling**    | CSS Modules + global tokens                             |
| **Animation**  | Framer Motion (reduced-motion aware)                    |
| **Testing**    | Vitest 4 + React Testing Library (90%/85% global thresholds) |
| **Linting**    | ESLint + Prettier                                       |
| **CI/CD**      | GitHub Actions + Cloudflare Pages                       |
| **Contact**    | Server-side endpoint (`VITE_CONTACT_ENDPOINT`)          |

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Private repository - access restricted
cd H4KU.COM
npm install
cp .env.example .env  # Configure VITE_CONTACT_ENDPOINT if needed
npm run dev
```

Development server runs at `http://localhost:5173`

#### Environment Variables

| Variable                | Description                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_CONTACT_ENDPOINT` | Server-side endpoint that handles contact form submissions. Defaults to `/api/contact` (Cloudflare Email Worker or Pages Function on same domain). |
| `VITE_CONTACT_TIMEOUT`  | (Optional) Timeout in milliseconds for contact submissions.                                                                                        |
| `VITE_TURNSTILE_SITE_KEY` | (Optional) Frontend Turnstile site key. Falls back to a test key in dev/E2E.                                                                     |
| `VITE_TURNSTILE_BYPASS_TOKEN` | (Optional) Auto-pass token for Turnstile; used by Playwright tests.                                                                           |
| `VITE_ALLOWED_DOMAINS`  | (Optional) Comma-separated overrides for domain lock whitelist.                                                                                    |
| `VITE_ENFORCE_DOMAIN_LOCK` | (Optional) Set to `false` to disable domain blocking even in production.                                                                        |
| `VITE_SENTRY_DSN`       | (Optional) Enables production crash reporting via Sentry.                                                                                          |
| `VITE_APP_VERSION`      | (Optional) Overrides the release tag reported to monitoring.                                                                                       |
| `VITE_APP_ENV`          | (Optional) Sets the monitoring environment label (`prod`, `staging`, etc.).                                                                        |

#### Server-side Environment Variables (Cloudflare Pages)

| Variable                | Description                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `TURNSTILE_SECRET_KEY`  | Cloudflare Turnstile secret key for human verification (required for contact form).           |
| `RESEND_API_KEY`        | Resend API key for sending emails.                                                            |
| `CONTACT_TO_EMAIL`      | Recipient email address for contact form submissions.                                         |

### Available Scripts

| Command                   | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Start development server with HMR                                                                 |
| `npm run build`           | Production build orchestrator (CMS → build-data → fingerprint → Vite → inline-critical)          |
| `npm run build:fast`      | Skip CMS & fingerprint for quick UI-only builds (`--skip=cms,fingerprint`)                       |
| `npm run build:data`      | Aggregate content JSON into `_aggregated.json` (auto-run by `npm run cms` and `npm run build`)    |
| `npm run preview`         | Preview production build locally                                                                  |
| `npm test`                | Run tests in watch mode                                                                           |
| `npm run test:run`        | Run tests once (CI mode)                                                                          |
| `npm run test:coverage`   | Generate coverage report (90% lines/functions/statements, 85% branches)                           |
| `npm run test:e2e`        | Playwright E2E smoke tests (dev server auto-start; injects Turnstile bypass envs)                 |
| `npm run test:ui`         | Open Vitest UI dashboard                                                                          |
| `npm run lint`            | Check code style                                                                                  |
| `npm run lint:fix`        | Fix auto-fixable lint issues                                                                      |
| `npm run format`          | Format code with Prettier                                                                         |
| `npm run format:check`    | Check code formatting                                                                             |
| `npm run type-check`      | Verify TypeScript types                                                                           |
| `npm run deps:prune`      | Remove extraneous packages (runs after install)                                                   |
| `npm run size`            | Check bundle size against limits                                                                  |
| `npm run size:analyze`    | Detailed bundle analysis                                                                          |
| `npm run integrity:check` | Verify or update `_aggregated.json` checksums                                                     |
| `npm run ci`              | Run all CI checks locally (quality → coverage → security → E2E → bundle size)                    |
| `npm run ci:quality`      | Run quality checks (lint, format, types)                                                          |
| `npm run ci:coverage`     | Run tests with coverage reporting                                                                 |
| `npm run ci:security`     | Run security scans                                                                                |
| `npm run ci:bundle`       | Build and check bundle size                                                                       |
| `npm run ci:deps`         | Report outdated dependencies (writes coverage/npm-outdated.json)                                  |
| `npm run ci:license`      | Check dependency licenses (writes coverage/licenses.csv)                                          |

### Content Management

Content lives in committed JSON under `src/content/` (currently three empty top-level folders plus About/Contact/License pages; no images are bundled yet). The CMS importer (`npm run cms`) scans `public/content/homepage/`, regenerates JSON, and then runs `npm run build:data` automatically; the aggregator writes `_integrity`/`_integritySHA256` into `_aggregated.json`.

- `folders/*.json` – Folder hierarchy and metadata
- `pages/*.json` – Text content
- `images/*.json` – Image/work metadata (thumb + full URLs under `public/content/`)
- `socials/*.json` – Social links

After editing any of the above, run `npm run cms` (regenerates JSON + `_aggregated.json`) and commit the refreshed snapshot.

## Testing

- Runner: Vitest 4 + Testing Library (jsdom)
- Suite size: ~49 specs (45 unit/integration, 4 Playwright E2E) as of January 2026
- Coverage: 90% global thresholds (lines/functions/statements) and 85% for branches

Focus areas:

- Context providers (navigation, search, sidebar, theme)
- Hooks with side effects (storage, focus trapping, debounced resize, deferred loading)
- Utilities (navigation maps, integrity hashing, URL helpers, color manipulation, type guards)
- Layout behaviors (search overlay, status bar, keyboard flows)
- Component unit tests (ContentView, FolderView, TextView, ErrorBoundary)
- E2E: contact two-step verification (Turnstile bypass), global search overlay, mobile/desktop sidebar flows

Principles: prefer behavior over implementation, keep mocks minimal, avoid snapshots, and keep the suite fast enough to run with every commit.

## Deployment

### Cloudflare Pages

Cloudflare Pages deployments run out of the box via the bundled `wrangler.toml`:

```bash
npm install
npm run build
npx wrangler pages deploy --project-name h4ku-com dist
```

- Adjust `pages_build_output_dir` or `name` inside `wrangler.toml` if your project slug differs.
- Set environment variables through the Cloudflare Pages dashboard:
  - `TURNSTILE_SECRET_KEY` - Required for contact form human verification
  - `RESEND_API_KEY` - For email notifications
  - `CONTACT_TO_EMAIL` - Recipient email address
  - `VITE_TURNSTILE_SITE_KEY` - Optional; overrides frontend Turnstile site key (falls back to test key)
  - `VITE_ALLOWED_DOMAINS` / `VITE_ENFORCE_DOMAIN_LOCK` - Optional; control domain locking behavior
  - `VITE_SENTRY_DSN` - Optional, for error monitoring
- Security headers (CSP, HSTS, Permissions-Policy, etc.) live in `public/_headers`. Update the `connect-src` directive there if your contact endpoint uses a different domain. Post-build inlining updates CSP hashes in `dist/index.html` and `dist/_headers`.

`vite-plugin-sitemap` runs during `vite build`, generating a fresh `dist/sitemap.xml` from the aggregated content so you no longer need to maintain a static `public/sitemap.xml`.

### CI/CD Pipeline

CI/CD can be configured to automatically run on every push:

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

## License

This project is licensed under the **HAKU Personal Source License (HPSL-1.0)**.

**Summary:** Source code is available for viewing only. Copying, deployment, redistribution, and commercial use are strictly prohibited. All artwork and content are exclusive intellectual property of the author.

See [LICENSE.md](./LICENSE.md) for full terms.

## Contact

For questions, collaboration, or licensing inquiries:

- **Email:** CONTACT@H4KU.COM
- **Website:** https://H4KU.COM

### Contact Form Setup

The contact form uses a two-step flow: form submission → verification page. This separates the user input from Turnstile verification for better UX on small screens.

**Flow:**
1. User fills out the contact form (`ContactForm.tsx`)
2. Form data is saved to sessionStorage (15-minute TTL)
3. User is redirected to the verification page (`ContactVerify.tsx`)
4. Turnstile verification is completed on the verification page
5. Upon success, the message is sent via the backend API

**Setup:**

1. **Configure Turnstile** in [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
   - Create a site and get your Site Key and Secret Key
   - Frontend uses `VITE_TURNSTILE_SITE_KEY` (falls back to a test key for dev/E2E); backend requires `TURNSTILE_SECRET_KEY`
   - Optional: `VITE_TURNSTILE_BYPASS_TOKEN` to auto-pass verification in E2E

2. **Configure Email** via [Resend](https://resend.com)
   - Get your API key and verify your domain
   - Set `RESEND_API_KEY` and `CONTACT_TO_EMAIL` in Pages settings

See [functions/README.md](./functions/README.md) for detailed setup instructions and alternative email providers.

---

### Security & Anti-tamper

- Domain lock: `src/utils/domainCheck.ts` blocks rendering on unauthorized hostnames (configurable via `VITE_ALLOWED_DOMAINS`, `VITE_ENFORCE_DOMAIN_LOCK`) and shows an overlay.
- Fingerprinting/watermarking: `scripts/inject-fingerprint.js` embeds build IDs/signatures; runtime injects DOM/CSS watermarks (`src/utils/fingerprint.ts`) and console copyright banners.
- Integrity: `_aggregated.json` carries FNV-1a + SHA-256 hashes; `src/data/mockData.ts` verifies both and throws before render if they mismatch.

---

**Note:** This is a personal portfolio project. The architecture and implementation patterns are shared for educational purposes, not as a template for cloning.
