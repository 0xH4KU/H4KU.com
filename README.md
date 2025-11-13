# Lum.bio

A file-system inspired portfolio built with React 19, TypeScript, and modern web standards. This repository demonstrates architectural patterns for building accessible, performant single-page applications with static data management.

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
│   │   └── emailjs.ts
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
│   ├── robots.txt
│   └── sitemap.xml
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

- React Router 7 with file-path routing patterns
- Deep links: `/folder/path/to/item` and `/page/page-id`
- O(1) path lookups via Map-based indexing
- Persistent navigation state across route changes

### Performance Optimizations

- **Lazy image loading** – Shared IntersectionObserver across all images
- **Debounced search** – 300ms delay with abort controller
- **CSS Modules** – Scoped styles, tree-shakeable
- **Reduced motion support** – Respects `prefers-reduced-motion`
- **Font loading strategy** – `font-display: swap` with fallback stack

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
| **Routing** | React Router 7.9 |
| **Language** | TypeScript 5.4 (strict mode) |
| **Build Tool** | Vite 7 |
| **Styling** | CSS Modules + global tokens |
| **Animation** | Framer Motion (reduced-motion aware) |
| **Testing** | Vitest 4 + React Testing Library |
| **Linting** | ESLint + Prettier |
| **CI/CD** | GitLab CI + Cloudflare Pages |
| **Email** | EmailJS (lazy-loaded) |

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/cwlum/lum.bio.git
cd lum.bio
npm install
cp .env.example .env  # Configure EmailJS credentials
npm run dev
```

Development server runs at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (includes data aggregation) |
| `npm run build:data` | Aggregate content JSON into `_aggregated.json` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ui` | Open Vitest UI dashboard |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix auto-fixable lint issues |
| `npm run type-check` | Verify TypeScript types |

### Content Management

Content is stored as JSON files in `src/content/`:

- `folders/*.json` – Folder hierarchy and metadata
- `pages/*.json` – Text content with markdown support
- `images/*.json` – Image metadata and captions
- `socials/*.json` – Social media links

After editing, run `npm run build:data` to regenerate `_aggregated.json`.

## Testing

180+ automated tests covering:

- Context providers (state management)
- Custom hooks (side effects, localStorage)
- Utility functions (sorting, navigation, parsing)
- Component behaviors (search, sidebar, layout)

**Testing philosophy:**
- Behavior-driven tests (not implementation details)
- Minimal mocking (test real integrations where possible)
- Fast execution (< 2 seconds for full suite on CI)
- No snapshot tests (explicit assertions only)

## Deployment

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

**Required environment variables:**
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

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

- **[CHANGELOG.md](./CHANGELOG.md)** – Release history
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** – Architecture deep dive
- **[TESTING.md](./TESTING.md)** – Testing guidelines
- **[GITLAB_CI_SETUP.md](./GITLAB_CI_SETUP.md)** – CI/CD configuration
- **[CONTENT_GUIDE.md](./CONTENT_GUIDE.md)** – Content authoring guide

## License

This project is licensed under the **Lum.bio Personal Source License (LPSL-1.0)**.

**Summary:** Source code is available for learning and reference. Deployment, redistribution, and commercial use are prohibited. Content and artwork remain exclusive to the author.

See [LICENSE.md](./LICENSE.md) for full terms.

## Contact

For questions, collaboration, or licensing inquiries:

- **Email:** hi@lum.bio
- **Issues:** [GitHub](https://github.com/cwlum/lum.bio/issues) / [GitLab](https://gitlab.com/lummuu/lum.bio/-/issues)

---

**Note:** This is a personal portfolio project. The architecture and implementation patterns are shared for educational purposes, not as a template for cloning.
