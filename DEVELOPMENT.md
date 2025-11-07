# Development Guide

Comprehensive guide for developing and maintaining the Lum.bio portfolio website.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [State Management Pattern](#state-management-pattern)
- [Styling System](#styling-system)
- [Routing Strategy](#routing-strategy)
- [Data Management](#data-management)
- [Performance Optimization](#performance-optimization)
- [Build and Deployment](#build-and-deployment)

## Architecture Overview

### Core Principles

1. **Static Site Architecture**: No backend server, all data is static
2. **Component-Based**: Modular, reusable React components
3. **Type-Safe**: Comprehensive TypeScript coverage
4. **CSS Modules**: Scoped, maintainable styles
5. **Context + Hooks**: Scalable state management pattern
6. **Client-Side Routing**: React Router for navigation

### Application Flow

```
User Interaction
      ↓
React Router (URL Change)
      ↓
Context Providers (Global State)
      ↓
Custom Hooks (Business Logic)
      ↓
Components (UI Rendering)
      ↓
CSS Modules (Scoped Styles)
```

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| react-dom | 19.2.0 | DOM rendering |
| react-router-dom | 7.9.5 | Client-side routing with URL support |
| typescript | 5.4.5 | Type safety |
| vite | 7.1.12 | Build tool & dev server |
| framer-motion | 12.23.24 | Animation library |
| lucide-react | 0.552.0 | Icon library |

### Development Tools

| Package | Purpose |
|---------|---------|
| @vitejs/plugin-react | React support for Vite |
| eslint | Code linting |
| prettier | Code formatting |
| typescript-eslint | TypeScript linting rules |

## Project Structure

### Directory Organization

```
lum.bio/
├── public/                    # Static assets (served as-is)
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component & route configuration
│   ├── components/           # React components
│   │   ├── layout/           # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── SearchPanel.tsx
│   │   ├── content/          # Content display
│   │   │   └── ContentView.tsx
│   │   └── overlay/          # Modals & overlays
│   │       ├── Lightbox.tsx
│   │       └── Crosshair.tsx
│   ├── contexts/             # React Context providers
│   │   ├── ThemeContext.tsx
│   │   ├── NavigationContext.tsx
│   │   └── SearchContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useTheme.ts
│   │   ├── useNavigation.ts
│   │   ├── useSearch.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useSidebar.ts
│   │   ├── useCrosshair.ts
│   │   ├── useDebounce.ts      # NEW: Performance optimization
│   │   └── useReducedMotion.ts # NEW: Accessibility support
│   ├── data/                 # Static data
│   │   └── mockData.ts       # Portfolio content
│   ├── styles/               # CSS Modules
│   │   ├── global.css        # Global styles & CSS variables
│   │   └── [Component].module.css
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   └── navigation.ts
│   └── assets/               # Images, fonts, etc.
│       ├── fonts/
│       └── images/
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .editorconfig             # Editor configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── package.json              # Dependencies & scripts
```

### Import Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```typescript
// ✅ Use path alias
import { useTheme } from '@/hooks/useTheme';
import { Sidebar } from '@/components/layout/Sidebar';

// ❌ Avoid relative paths
import { useTheme } from '../../hooks/useTheme';
```

## State Management Pattern

### Architecture: Context API + Custom Hooks

We use a hybrid approach that separates concerns:

1. **Context Providers**: Hold global state
2. **Custom Hooks**: Encapsulate business logic
3. **Components**: Pure presentation layer

### Context Organization

Each major feature has its own context:

```typescript
// contexts/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

// contexts/NavigationContext.tsx
interface NavigationContextValue {
  currentPath: string[];
  currentView: ViewType | null;
  navigateTo: (path: string[]) => void;
  navigateBack: () => void;
}

// contexts/SearchContext.tsx
interface SearchContextValue {
  searchQuery: string;
  searchOpen: boolean;
  searchResults: SearchResult[];
  openSearch: () => void;
  closeSearch: () => void;
}
```

### Provider Composition

Compose providers in `App.tsx`:

```tsx
function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <SearchProvider>
          <RouterProvider router={router} />
        </SearchProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
```

### Custom Hooks Pattern

Custom hooks consume contexts and add business logic:

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  // Add computed values or additional logic
  const isDark = context.theme === 'dark';
  const themeClass = isDark ? 'dark' : 'light';

  return {
    ...context,
    isDark,
    themeClass,
  };
}
```

### State Update Patterns

```typescript
// ✅ DO: Use functional updates for state derived from previous state
setCount(prev => prev + 1);

// ❌ DON'T: Directly reference state in updates
setCount(count + 1);

// ✅ DO: Batch related state updates
setUser({ name: 'John', age: 30 });

// ❌ DON'T: Multiple separate updates
setUserName('John');
setUserAge(30);
```

## Styling System

### CSS Modules Architecture

Each component has its own CSS Module file:

```
components/
  TopBar/
    TopBar.tsx
    TopBar.module.css
```

### Global Styles & CSS Variables

Global styles and CSS custom properties are defined in `styles/global.css`:

```css
/* styles/global.css */

/* CSS Reset */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* CSS Custom Properties */
:root {
  /* Colors - Light Theme */
  --color-background: #ffffff;
  --color-text: #000000;
  --color-primary: #689696;
  --color-secondary: #e87722;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;

  /* Typography */
  --font-family: 'ProFont', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Layout */
  --sidebar-width: 240px;
  --topbar-height: 40px;
  --statusbar-height: 24px;
}

/* Dark Theme */
[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
}
```

### Component CSS Module Pattern

```css
/* TopBar.module.css */

/* Use CSS variables for theming */
.topBar {
  height: var(--topbar-height);
  background-color: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

/* Use kebab-case for class names */
.nav-button {
  padding: var(--spacing-sm);
  color: var(--color-text);
}

/* Use BEM-like modifiers */
.nav-button--active {
  background-color: var(--color-primary);
}

/* Mobile-first responsive design */
.topBar {
  display: flex;
}

@media (max-width: 768px) {
  .topBar {
    flex-direction: column;
  }
}
```

### Component Usage

```tsx
// TopBar.tsx
import styles from './TopBar.module.css';
import { clsx } from 'clsx'; // Optional: for conditional classes

export function TopBar({ isActive }: TopBarProps) {
  return (
    <div className={styles.topBar}>
      <button
        className={clsx(
          styles.navButton,
          isActive && styles['navButton--active']
        )}
      >
        Click
      </button>
    </div>
  );
}
```

### Theming Best Practices

1. **Always use CSS variables** for colors, spacing, and sizes
2. **Theme switching** via `[data-theme]` attribute on `<body>`
3. **Avoid hardcoded colors** in component styles
4. **Use semantic naming** for variables (e.g., `--color-text`, not `--color-black`)

## Routing Strategy

### React Router Configuration

We use React Router for client-side navigation:

```tsx
// App.tsx or routes/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'work',
        element: <WorkPage />,
      },
      {
        path: 'work/:id',
        element: <WorkDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### Navigation Patterns

```tsx
// Declarative navigation with Link
import { Link } from 'react-router-dom';

<Link to="/work">View Work</Link>
<Link to={`/work/${item.id}`}>View Details</Link>

// Programmatic navigation with useNavigate
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/work', { replace: false });
  };

  const goBack = () => {
    navigate(-1); // Go back in history
  };
}

// Access route parameters
import { useParams } from 'react-router-dom';

function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Use id to fetch work item
}
```

### URL Structure

```
/                          # Home page (all folders and pages)
/work                      # Work folder view
/work/:id                  # Individual work item
/about                     # About page
/contact                   # Contact page
```

### Cloudflare Pages Routing

For Cloudflare Pages deployment, add a `public/_redirects` file:

```
/*    /index.html   200
```

This ensures all routes are handled by React Router (SPA routing).

## Data Management

### Static Data Structure

Portfolio data is defined in `src/data/mockData.ts`:

```typescript
// data/mockData.ts
import { Folder, WorkItem } from '@/types';

export const folders: Folder[] = [
  {
    id: 'work',
    name: 'Work',
    type: 'folder',
    children: [
      {
        id: 'project-1',
        name: 'Project Name',
        type: 'work',
        title: 'Project Title',
        description: 'Project description',
        image: '/images/project-1.jpg',
        tags: ['React', 'TypeScript'],
      },
    ],
  },
];
```

### Data Access Pattern

```typescript
// ✅ DO: Use helper functions to access data
export function getFolderById(id: string): Folder | undefined {
  return findInTree(folders, (item) => item.id === id);
}

export function getWorkItems(): WorkItem[] {
  return flattenTree(folders).filter(isWorkItem);
}

// ✅ DO: Use useMemo for expensive computations
const workItems = useMemo(() => {
  return getWorkItems();
}, []);
```

### Future: API Integration

When transitioning to dynamic data:

```typescript
// hooks/useWorkItems.ts
export function useWorkItems() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/work')
      .then(res => res.json())
      .then(data => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}
```

## Performance Optimization

### Optimization Strategies

1. **Code Splitting**: Use React.lazy() for route-based splitting
2. **Memoization**: Use useMemo/useCallback for expensive operations
3. **Image Optimization**: Use WebP format, lazy loading
4. **Tree Shaking**: Vite automatically removes unused code
5. **CSS Optimization**: CSS Modules prevents unused styles

### React Performance Patterns

```tsx
// ✅ DO: Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.date - b.date);
}, [items]);

// ✅ DO: Memoize callbacks passed to children
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// ✅ DO: Use React.lazy for code splitting
const WorkDetailPage = lazy(() => import('@/pages/WorkDetailPage'));

// ✅ DO: Use Suspense for lazy-loaded components
<Suspense fallback={<Loading />}>
  <WorkDetailPage />
</Suspense>
```

### Image Optimization

```tsx
// ✅ DO: Use srcset for responsive images
<img
  src="/images/project-small.jpg"
  srcSet="/images/project-small.jpg 480w,
          /images/project-medium.jpg 768w,
          /images/project-large.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Project"
  loading="lazy"
/>
```

## Build and Deployment

### Development Build

```bash
npm run dev
```

- Runs Vite dev server on http://localhost:5173
- Hot Module Replacement (HMR) enabled
- Source maps enabled

### Production Build

```bash
npm run build
```

- Minifies JavaScript and CSS
- Generates source maps
- Optimizes assets
- Output: `dist/` directory

### Preview Production Build

```bash
npm run preview
```

Runs a local server to preview the production build.

### Deployment to Cloudflare Pages

**Automatic Deployment:**

1. Push to GitLab
2. Cloudflare Pages automatically builds and deploys

**Build Settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18 or later

**Environment Variables:**
None required (static site)

### Build Optimization

Vite configuration (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

## Development Workflow

### Daily Development

1. Pull latest changes: `git pull`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Make changes
5. Run linter: `npm run lint`
6. Format code: `npm run format`
7. Commit: `git commit -m "feat: description"`
8. Push: `git push`

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement feature
3. Add types if needed
4. Add CSS Module
5. Test locally
6. Commit with conventional commit message
7. Push and create PR

### Debugging Tips

```tsx
// Use React DevTools for component inspection
// Install: https://react.dev/learn/react-developer-tools

// Use console.log sparingly (remove before commit)
console.log('Debug:', value);

// Use debugger statement for breakpoints
debugger;

// Check Vite logs for build errors
// Check browser console for runtime errors
```

## Common Issues and Solutions

### Issue: CSS Module classes not applying

**Solution:** Ensure you're using the correct import and className:

```tsx
import styles from './Component.module.css';

// ✅ Correct
<div className={styles.myClass} />

// ❌ Incorrect
<div className="myClass" />
```

### Issue: Route not working after deployment

**Solution:** Add `_redirects` file to `public/`:

```
/*    /index.html   200
```

### Issue: Context undefined error

**Solution:** Ensure component is wrapped in provider:

```tsx
// ❌ Component used outside provider
<MyComponent /> // Error: useTheme must be used within ThemeProvider

// ✅ Component inside provider
<ThemeProvider>
  <MyComponent />
</ThemeProvider>
```

## Recent Enhancements (2025-11-06)

### URL Routing Implementation

The application now uses React Router for full URL-based navigation:

```typescript
// URL Structure
/                        → Home (all folders)
/folder/{id}             → Single folder view
/folder/{parent}/{child} → Nested folder view
/page/{id}               → Text page view
```

**Implementation Details:**
- NavigationContext syncs with URL changes
- Browser back/forward buttons work correctly
- All pages are bookmarkable and shareable
- Clean RESTful URL structure

### Custom Hooks Library

**useDebounce**
```typescript
// Performance: Debounce user input
const debouncedQuery = useDebounce(searchQuery, 300);
```

**useReducedMotion**
```typescript
// Accessibility: Respect motion preferences
const prefersReducedMotion = useReducedMotion();
const animationProps = prefersReducedMotion ? {} : { scale: 1.1 };
```

**useSidebar**
```typescript
// Persistent sidebar width with localStorage
const { sidebarWidth, isDragging, startDrag } = useSidebar(240);
```

**useCrosshair**
```typescript
// Developer tool: Pixel-perfect alignment
const { showCrosshair, mousePos } = useCrosshair();
```

### Accessibility Best Practices

**Focus Indicators:**
All interactive elements have visible focus states:
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Skip Links:**
Keyboard users can skip to main content:
```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

**ARIA Attributes:**
- `aria-label` on icon buttons
- `aria-hidden` on decorative elements
- `role="main"` on content area

**Reduced Motion:**
All animations respect `prefers-reduced-motion`:
```tsx
const variants = useMemo(() => ({
  initial: { opacity: prefersReducedMotion ? 1 : 0 },
  animate: { opacity: 1 }
}), [prefersReducedMotion]);
```

### Performance Optimizations

**Search Debouncing:**
```typescript
// SearchContext.tsx
const debouncedQuery = useDebounce(searchQuery, 300);
const searchResults = useMemo(() => {
  // Expensive search only runs after 300ms pause
}, [debouncedQuery]);
```

**Image Error Handling:**
```typescript
// LazyImage.tsx
const handleError = () => {
  setImageSrc(ERROR_PLACEHOLDER); // Graceful fallback
};
```

**Persistent Preferences:**
- Sidebar width saved to localStorage
- Theme preference saved to localStorage
- All preferences restore on reload

### Lightbox Enhancements

**Gallery Navigation:**
```typescript
// NavigationContext now tracks gallery
const {
  lightboxImage,
  lightboxGallery,
  lightboxIndex,
  navigateToNextImage,
  navigateToPrevImage
} = useNavigation();
```

**Keyboard Support:**
- `←/→` - Navigate between images
- `ESC` - Close lightbox
- Visual counter: "3 / 10"

### Search Improvements

**Keyboard Navigation:**
```typescript
// SearchPanel.tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') setSelectedIndex(prev => prev + 1);
  if (e.key === 'ArrowUp') setSelectedIndex(prev => prev - 1);
  if (e.key === 'Enter') selectCurrentResult();
};
```

**Visual Feedback:**
Selected search result highlighted with primary color.

## Next Steps

- [ ] Add unit tests (Vitest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Add performance monitoring
- [ ] Add analytics
- [ ] Add SEO optimization (meta tags, sitemap)
- [ ] Consider adding animation preferences toggle in UI
- [ ] Add keyboard shortcuts documentation modal

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)

## Questions?

Check the [CONTRIBUTING.md](./CONTRIBUTING.md) or open a discussion on GitLab.
