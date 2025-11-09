# AI Agent Instructions

Quick reference guide for AI assistants working on this project.

**Last Updated:** 2025-11-06
**Status:** Production-ready with recent accessibility and performance enhancements

## Project Type

**Static Portfolio Website** - No backend, deployed on Cloudflare Pages

## Tech Stack

- React 19.2 + TypeScript 5.4
- Vite 7.1 (build tool)
- React Router 7.9 (URL-based routing with deep linking)
- Framer Motion 12.23 (animations with reduced motion support)
- CSS Modules (scoped styling)
- Context API + Custom Hooks (state management)

## Key Principles

1. **Type Safety First**: No `any` types, proper TypeScript typing
2. **CSS Modules Only**: Never use inline styles or global CSS classes
3. **Context + Hooks**: State management pattern (not Redux/Zustand)
4. **Functional Components**: No class components
5. **Path Aliases**: Use `@/` for `src/` imports
6. **Accessibility First**: Focus indicators, ARIA labels, keyboard navigation
7. **Reduced Motion**: Respect `prefers-reduced-motion` user preference
8. **URL Routing**: All pages must have shareable URLs

## File Naming Rules

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `TopBar.tsx` |
| CSS Modules | PascalCase.module.css | `TopBar.module.css` |
| Hooks | camelCase.ts | `useTheme.ts` |
| Contexts | PascalCase + Context.tsx | `ThemeContext.tsx` |
| Utils | camelCase.ts | `navigation.ts` |
| Types | lowercase.ts | `index.ts` |

## Component Structure Template

```tsx
// 1. Imports (external → internal → styles)
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import styles from './Component.module.css';

// 2. Types
interface ComponentProps {
  title: string;
}

// 3. Component
export function Component({ title }: ComponentProps) {
  const [state, setState] = useState('');
  const { theme } = useTheme();

  const handleClick = () => {
    // Handler logic
  };

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
    </div>
  );
}
```

## CSS Module Rules

```css
/* Use kebab-case for classes */
.my-component {
  /* Use CSS variables from :root */
  color: var(--color-text);
  padding: var(--spacing-md);
}

/* Use BEM-like modifiers */
.button--active {
  background: var(--color-primary);
}
```

## State Management Pattern

### Create Context

```tsx
// contexts/FeatureContext.tsx
interface FeatureContextValue {
  value: string;
  setValue: (v: string) => void;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState('');
  return (
    <FeatureContext.Provider value={{ value, setValue }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) throw new Error('useFeature must be within FeatureProvider');
  return context;
}
```

## Routing Pattern

```tsx
// Use React Router
import { Link, useNavigate } from 'react-router-dom';

// Declarative
<Link to="/work">Work</Link>

// Programmatic
const navigate = useNavigate();
navigate('/work');
```

## Common Patterns

### Conditional Classes

```tsx
import styles from './Component.module.css';

<div className={`${styles.button} ${isActive ? styles['button--active'] : ''}`} />
```

### Import Aliases

```tsx
// ✅ Always use @/ alias
import { useTheme } from '@/hooks/useTheme';
import { TopBar } from '@/components/layout/TopBar';

// ❌ Never use relative paths
import { useTheme } from '../../hooks/useTheme';
```

### Event Handlers

```tsx
// ✅ Use handle prefix
const handleClick = () => {};
const handleSubmit = () => {};

// ❌ Avoid generic names
const onClick = () => {};
const submit = () => {};
```

## Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, perf, test, chore
```

Examples:
- `feat(sidebar): add resize functionality`
- `fix(navigation): correct breadcrumb path`
- `refactor(theme): extract theme logic to context`

## What NOT to Do

❌ Use `any` type
❌ Use inline styles
❌ Use global CSS classes (except in global.css)
❌ Use class components
❌ Import without @/ alias
❌ Add console.log (remove before commit)
❌ Use relative imports for src/ files
❌ Create .css files without .module suffix
❌ Use prop drilling (use Context instead)

## What to ALWAYS Do

✅ Use TypeScript interfaces for props
✅ Use CSS Modules for styling
✅ Use functional components
✅ Use @/ import alias
✅ Extract logic into custom hooks
✅ Use Context for global state
✅ Remove unused imports
✅ Follow file naming conventions

## Directory Rules

- New components → `src/components/{category}/`
- New hooks → `src/hooks/`
- New contexts → `src/contexts/`
- New styles → Same directory as component (`.module.css`)
- New types → `src/types/`
- New utils → `src/utils/`

## Build Commands

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier (auto-fix)
- `npm run format:check` - Check if code is formatted
- `npm run type-check` - Run TypeScript compiler check

## Deployment Target

**Cloudflare Pages**
- Build: `npm run build`
- Output: `dist/`
- Add `public/_redirects`: `/*    /index.html   200`

## Recent Features (2025-11-06)

### URL Routing
All navigation now syncs with URLs:
```typescript
/                      → Home
/folder/{id}           → Folder view
/page/{id}             → Text page
```

### New Hooks Available

**useDebounce** - Performance optimization:
```typescript
const debouncedValue = useDebounce(inputValue, 300);
```

**useReducedMotion** - Accessibility:
```typescript
const prefersReducedMotion = useReducedMotion();
// Conditionally disable animations
```

**useSidebar** - Persistent preferences:
```typescript
const { sidebarWidth, startDrag } = useSidebar(240);
// Width auto-saved to localStorage
```

### Accessibility Requirements

**Always Include:**
- `aria-label` on icon-only buttons
- `aria-hidden="true"` on decorative elements
- `role="main"` on main content area
- Visible focus indicators (`:focus-visible`)

**Example:**
```tsx
<button aria-label="Close dialog" onClick={handleClose}>
  <X size={16} />
</button>

<div aria-hidden="true">
  <DecorativeGraphic />
</div>
```

### Animation Pattern with Reduced Motion

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

### Lightbox with Gallery Support

```tsx
// Open lightbox with full gallery context
openLightbox(currentImage, allImages);

// Navigate between images
navigateToNextImage(); // or press →
navigateToPrevImage(); // or press ←
```

### Search with Debouncing

Search queries are automatically debounced (300ms):
```typescript
// In SearchContext, debouncedQuery is used internally
// No action needed when implementing search features
```

## CI/CD Pipeline Checks

**CRITICAL:** Always run these checks before committing to avoid CI failures:

```bash
# 1. Format code (auto-fix)
npm run format

# 2. Run all CI checks locally
npm run lint           # ESLint - code quality
npm run type-check     # TypeScript - type safety
npm run format:check   # Prettier - code formatting
```

**Why these checks matter:**
- CI pipeline runs these exact commands
- If any check fails, the entire pipeline fails
- Failed CI = blocked deployment to production
- Running locally first saves time and CI resources

**Common CI failures:**
- ❌ **Prettier formatting** - Most common! Run `npm run format` before commit
- ❌ **TypeScript errors** - Fix type errors before committing
- ❌ **ESLint violations** - Clean up code quality issues

**Best Practice Workflow:**
```bash
# After editing files
npm run format        # Fix formatting automatically
npm run type-check    # Verify no type errors
git add .
git commit -m "..."
git push
```

## Quick Checks Before Commit

1. [ ] **Run `npm run format`** ← Most important!
2. [ ] **Run `npm run type-check`** ← Catches type errors
3. [ ] **Run `npm run lint`** ← Catches code quality issues
4. [ ] No TypeScript errors
5. [ ] No ESLint errors
6. [ ] CSS Modules used (no inline styles)
7. [ ] Imports use @/ alias
8. [ ] No console.log statements
9. [ ] No unused imports/variables
10. [ ] Component has proper TypeScript types
11. [ ] Proper commit message format
12. [ ] Accessibility: ARIA labels where needed
13. [ ] Accessibility: Focus indicators present
14. [ ] Animations respect reduced motion preference
15. [ ] URLs are shareable (if navigation involved)

## Full Documentation

- **CHANGELOG.md** - Recent changes and enhancements (2025-11-06)
- **README.md** - Project overview and features
- **CONTRIBUTING.md** - Detailed code standards
- **DEVELOPMENT.md** - Architecture and patterns

## Questions?

1. Check **CHANGELOG.md** for latest changes
2. Check existing code for patterns
3. Read CONTRIBUTING.md for details
4. Read DEVELOPMENT.md for architecture
