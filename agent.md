# AI Agent Instructions

Quick reference guide for AI assistants working on this project.

## Project Type

**Static Portfolio Website** - No backend, deployed on Cloudflare Pages

## Tech Stack

- React 18.3 + TypeScript 5.4
- Vite 7.1 (build tool)
- React Router 6 (client-side routing)
- CSS Modules (scoped styling)
- Context API + Custom Hooks (state management)

## Key Principles

1. **Type Safety First**: No `any` types, proper TypeScript typing
2. **CSS Modules Only**: Never use inline styles or global CSS classes
3. **Context + Hooks**: State management pattern (not Redux/Zustand)
4. **Functional Components**: No class components
5. **Path Aliases**: Use `@/` for `src/` imports

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

## Testing (When Added)

```tsx
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Build Commands

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

## Deployment Target

**Cloudflare Pages**
- Build: `npm run build`
- Output: `dist/`
- Add `public/_redirects`: `/*    /index.html   200`

## Quick Checks Before Commit

1. [ ] No TypeScript errors
2. [ ] No ESLint errors
3. [ ] CSS Modules used (no inline styles)
4. [ ] Imports use @/ alias
5. [ ] No console.log statements
6. [ ] No unused imports/variables
7. [ ] Component has proper TypeScript types
8. [ ] Proper commit message format

## Full Documentation

- README.md - Project overview
- CONTRIBUTING.md - Detailed code standards
- DEVELOPMENT.md - Architecture and patterns

## Questions?

1. Check existing code for patterns
2. Read CONTRIBUTING.md for details
3. Read DEVELOPMENT.md for architecture
