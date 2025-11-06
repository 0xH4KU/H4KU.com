# GitHub Copilot Instructions

Instructions for GitHub Copilot when working on this React + TypeScript portfolio project.

## Project Context

This is a **static portfolio website** built with React 18, TypeScript, and Vite. It will be deployed on **Cloudflare Pages** (no backend server).

## Technology Stack

- **Framework**: React 18.3 with TypeScript 5.4
- **Build Tool**: Vite 7.1
- **Routing**: React Router 6
- **Styling**: CSS Modules (scoped styles)
- **State**: Context API + Custom Hooks
- **Icons**: lucide-react

## Code Generation Rules

### TypeScript

- Never use `any` type - always provide proper types
- All component props must have TypeScript interfaces
- Interface naming: `{ComponentName}Props`, `{Feature}ContextValue`, `Use{Feature}Return`
- Use type unions for literal values: `type Theme = 'light' | 'dark'`

### React Components

Generate components with this structure:

```tsx
import { useState } from 'react';
import { useCustomHook } from '@/hooks/useCustomHook';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  title: string;
  onAction: () => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  const [state, setState] = useState('');

  const handleClick = () => {
    onAction();
  };

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <button onClick={handleClick}>Click</button>
    </div>
  );
}
```

### Styling

- **Always use CSS Modules** - never inline styles or global classes
- CSS file naming: `ComponentName.module.css`
- Import as: `import styles from './ComponentName.module.css'`
- Use CSS variables: `var(--color-text)`, `var(--spacing-md)`
- Class naming: kebab-case (`.my-class`, `.nav-button`)
- Modifiers: BEM-like (`.button--active`, `.button--disabled`)

Example CSS Module:

```css
.container {
  padding: var(--spacing-md);
  background-color: var(--color-background);
}

.button {
  color: var(--color-text);
}

.button--active {
  background-color: var(--color-primary);
}
```

### Imports

- **Always use `@/` alias** for src imports
- Import order: external → internal → styles
- Never use relative paths like `../../`

```tsx
// ✅ Correct
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import styles from './Component.module.css';

// ❌ Wrong
import { useTheme } from '../../hooks/useTheme';
```

### State Management

Use Context API pattern:

```tsx
// contexts/FeatureContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

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
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider');
  }
  return context;
}
```

### Custom Hooks

```tsx
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

### Routing

Use React Router patterns:

```tsx
// Declarative navigation
import { Link } from 'react-router-dom';
<Link to="/work">View Work</Link>

// Programmatic navigation
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/work');

// Route parameters
import { useParams } from 'react-router-dom';
const { id } = useParams<{ id: string }>();
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `TopBar`, `ContentView` |
| Files (components) | PascalCase.tsx | `TopBar.tsx` |
| CSS Modules | PascalCase.module.css | `TopBar.module.css` |
| Hooks | camelCase | `useTheme`, `useNavigation` |
| Contexts | PascalCase + Context | `ThemeContext`, `NavigationContext` |
| Props interfaces | {Component}Props | `TopBarProps`, `ButtonProps` |
| CSS classes | kebab-case | `.nav-button`, `.search-panel` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WIDTH`, `DEFAULT_THEME` |
| Event handlers | handle{Event} | `handleClick`, `handleSubmit` |

## Common Patterns

### Conditional CSS Classes

```tsx
<button
  className={`${styles.button} ${isActive ? styles['button--active'] : ''}`}
>
  Click
</button>
```

### Event Handlers

```tsx
const handleClick = () => {
  // Logic here
};

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  // Logic here
};
```

### useEffect Patterns

```tsx
// Run once on mount
useEffect(() => {
  fetchData();
}, []);

// Run when dependency changes
useEffect(() => {
  updateData(userId);
}, [userId]);

// Cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

## File Organization

Place new files in the correct directory:

- Components → `src/components/{category}/ComponentName.tsx`
- Hooks → `src/hooks/useHookName.ts`
- Contexts → `src/contexts/ContextName.tsx`
- Types → `src/types/` (usually `index.ts`)
- Utils → `src/utils/utilName.ts`
- CSS Modules → Same directory as component

## What NOT to Generate

❌ Inline styles (`style={{ color: 'red' }}`)
❌ Global CSS classes (without `.module.css`)
❌ `any` types
❌ Class components
❌ Relative imports from src/ (`../../component`)
❌ console.log statements (for production code)
❌ Unused imports or variables

## What to ALWAYS Generate

✅ TypeScript interfaces for all props
✅ CSS Modules for all styling
✅ Functional components only
✅ @/ import aliases
✅ Proper error handling
✅ Descriptive variable names
✅ Event handler functions (not inline arrow functions)

## Performance Patterns

```tsx
// Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.date - b.date);
}, [items]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// Code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## Accessibility

Always include:
- Semantic HTML elements
- ARIA labels when needed
- Keyboard navigation support
- Alt text for images

```tsx
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-pressed={isOpen}
>
  <CloseIcon />
</button>

<img src={image} alt="Project screenshot showing dashboard" />
```

## Testing Patterns (When Tests Exist)

```tsx
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders with correct text', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls handler on click', () => {
    const handleClick = jest.fn();
    render(<ComponentName onAction={handleClick} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Common Imports

```tsx
// React
import { useState, useEffect, useMemo, useCallback } from 'react';

// React Router
import { Link, useNavigate, useParams } from 'react-router-dom';

// Icons
import { ChevronLeft, Search, X } from 'lucide-react';

// Project imports (use @/ alias)
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import styles from './Component.module.css';
```

## CSS Variables Available

Use these CSS variables defined in `styles/global.css`:

### Colors
- `--color-background`
- `--color-text`
- `--color-primary` (teal: #689696)
- `--color-secondary` (orange: #e87722)
- `--color-border`

### Spacing
- `--spacing-xs` (0.25rem)
- `--spacing-sm` (0.5rem)
- `--spacing-md` (1rem)
- `--spacing-lg` (1.5rem)
- `--spacing-xl` (2rem)

### Typography
- `--font-family` ('ProFont', monospace)
- `--font-size-xs` (0.75rem)
- `--font-size-sm` (0.875rem)
- `--font-size-md` (1rem)
- `--font-size-lg` (1.25rem)

### Layout
- `--sidebar-width`
- `--topbar-height`
- `--statusbar-height`

## Quick Reference

**Create new component**: Generate .tsx file + .module.css file
**Add state**: Use useState with proper TypeScript type
**Add global state**: Create Context in `contexts/` folder
**Add reusable logic**: Create hook in `hooks/` folder
**Style component**: Use CSS Module with CSS variables
**Navigate**: Use React Router's Link or useNavigate
**Import from src**: Always use @/ alias

## Documentation

For more details, refer to:
- `agent.md` - Quick AI reference
- `CONTRIBUTING.md` - Code standards
- `DEVELOPMENT.md` - Architecture details
