# Contributing Guidelines

Thank you for contributing to Lum.bio! This document outlines the code standards and best practices for this project.

## Code Standards

### General Principles

1. **Consistency**: Follow established patterns in the codebase
2. **Simplicity**: Write clear, readable code over clever code
3. **Type Safety**: Leverage TypeScript's type system fully
4. **Performance**: Optimize only when necessary, measure first
5. **Accessibility**: Ensure UI is keyboard navigable and screen-reader friendly

## File Organization

### Directory Structure

```
src/
├── components/         # React components (organized by feature)
│   ├── layout/        # Layout components
│   ├── content/       # Content display components
│   └── overlay/       # Overlay/modal components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── data/              # Static data files
├── styles/            # CSS Module files
├── types/             # TypeScript type definitions
├── utils/             # Pure utility functions
└── assets/            # Static assets
```

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase + `.tsx` | `TopBar.tsx`, `ContentView.tsx` |
| CSS Modules | PascalCase + `.module.css` | `TopBar.module.css` |
| Hooks | camelCase + `.ts` | `useTheme.ts`, `useNavigation.ts` |
| Contexts | PascalCase + `Context.tsx` | `ThemeContext.tsx` |
| Utils | camelCase + `.ts` | `navigation.ts`, `dateFormat.ts` |
| Types | lowercase + `.ts` | `index.ts` (in types folder) |
| Constants | SCREAMING_SNAKE_CASE | `SIDEBAR_MIN_WIDTH` |

## TypeScript Guidelines

### Type Definitions

```typescript
// ✅ DO: Use interfaces for component props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ DO: Use type for unions and aliases
type Theme = 'light' | 'dark';
type Status = 'idle' | 'loading' | 'success' | 'error';

// ❌ DON'T: Use 'any' type
const data: any = fetchData(); // Avoid this

// ✅ DO: Use proper typing
const data: UserData = fetchData();

// ✅ DO: Export types from component files
export interface WorkItem {
  id: string;
  title: string;
  description: string;
  image: string;
}
```

### Type Naming

- Component Props: `{ComponentName}Props`
- Context Values: `{Feature}ContextValue`
- Hook Returns: `Use{Feature}Return`

```typescript
// Component props
interface TopBarProps { /* ... */ }

// Context value
interface ThemeContextValue { /* ... */ }

// Hook return type
interface UseNavigationReturn { /* ... */ }
```

## React Component Guidelines

### Component Structure

```tsx
// 1. Imports (grouped and ordered)
import { useState, useEffect } from 'react';
import { ExternalLibrary } from 'external-package';
import { useCustomHook } from '@/hooks/useCustomHook';
import { ChildComponent } from './ChildComponent';
import styles from './MyComponent.module.css';

// 2. Type definitions
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Constants (component-level)
const MAX_ITEMS = 10;

// 4. Component definition
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 4.1. Hooks (always at the top)
  const [state, setState] = useState<string>('');
  const customValue = useCustomHook();

  // 4.2. Event handlers
  const handleClick = () => {
    onAction();
  };

  // 4.3. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 4.4. Computed values
  const displayTitle = title.toUpperCase();

  // 4.5. Render
  return (
    <div className={styles.container}>
      <h1>{displayTitle}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}

// 5. Default export (if needed)
export default MyComponent;
```

### Component Best Practices

```tsx
// ✅ DO: Use functional components
export function MyComponent() { /* ... */ }

// ❌ DON'T: Use class components
class MyComponent extends React.Component { /* ... */ }

// ✅ DO: Use named exports for components
export function Button() { /* ... */ }

// ✅ DO: Destructure props in function signature
function Button({ label, onClick }: ButtonProps) { /* ... */ }

// ❌ DON'T: Access props object directly
function Button(props: ButtonProps) {
  return <button>{props.label}</button>; // Avoid
}

// ✅ DO: Use early returns for conditional rendering
function UserProfile({ user }: UserProfileProps) {
  if (!user) return null;
  if (user.loading) return <Spinner />;

  return <div>{user.name}</div>;
}

// ❌ DON'T: Use nested ternaries
function UserProfile({ user }: UserProfileProps) {
  return user ? user.loading ? <Spinner /> : <div>{user.name}</div> : null;
}
```

## CSS Modules Guidelines

### File Structure

Each component should have its own CSS Module file:

```
components/
  TopBar/
    TopBar.tsx
    TopBar.module.css
```

### CSS Naming Conventions

```css
/* Use kebab-case for class names */
.top-bar {
  display: flex;
}

.nav-button {
  padding: 8px;
}

/* Use BEM-like modifiers for variants */
.nav-button--active {
  background-color: var(--color-primary);
}

.nav-button--disabled {
  opacity: 0.5;
}
```

### Usage in Components

```tsx
import styles from './TopBar.module.css';

export function TopBar({ isActive }: TopBarProps) {
  return (
    <div className={styles.topBar}>
      <button
        className={`${styles.navButton} ${isActive ? styles['navButton--active'] : ''}`}
      >
        Click me
      </button>
    </div>
  );
}
```

### CSS Best Practices

```css
/* ✅ DO: Use CSS custom properties for theming */
.button {
  color: var(--color-text);
  background-color: var(--color-background);
}

/* ✅ DO: Use relative units */
.container {
  padding: 1rem;
  font-size: 0.875rem;
}

/* ❌ DON'T: Use pixel values for typography */
.text {
  font-size: 14px; /* Avoid */
}

/* ✅ DO: Use rem for typography */
.text {
  font-size: 0.875rem; /* 14px */
}

/* ✅ DO: Group related properties */
.box {
  /* Positioning */
  position: relative;
  top: 0;

  /* Box model */
  display: flex;
  width: 100%;
  padding: 1rem;

  /* Typography */
  font-size: 1rem;
  color: var(--color-text);

  /* Visual */
  background-color: var(--color-background);
  border: 1px solid var(--color-border);

  /* Misc */
  cursor: pointer;
}
```

## State Management

### Context API Usage

Create separate contexts for different concerns:

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Custom Hooks

Extract complex logic into custom hooks:

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

## React Router Guidelines

### Route Definition

```tsx
// App.tsx or routes/index.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Navigation

```tsx
// Use Link for internal navigation
import { Link } from 'react-router-dom';

<Link to="/work">View Work</Link>

// Use useNavigate for programmatic navigation
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/work');
  };
}
```

## Git Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no code change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(sidebar): add resize functionality

Implement drag-to-resize feature for sidebar with min/max width constraints.

Closes #123
```

```bash
fix(navigation): correct breadcrumb path calculation

Fixed issue where nested paths were not displaying correctly in breadcrumb.
```

```bash
docs: update contributing guidelines

Add CSS Modules and React Router guidelines.
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guide
- [ ] TypeScript types are properly defined (no `any`)
- [ ] Components are properly typed with interfaces
- [ ] CSS Modules are used for styling
- [ ] No console.log statements in production code
- [ ] Variable and function names are descriptive
- [ ] Complex logic has comments explaining why
- [ ] No unused imports or variables
- [ ] Code is formatted with Prettier
- [ ] ESLint shows no errors
- [ ] All functions have proper error handling

## Accessibility Guidelines

### Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Already provided globally in global.css */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### ARIA Labels

```tsx
// ✅ DO: Add aria-label to icon-only buttons
<button aria-label="Close dialog" onClick={handleClose}>
  <X size={16} />
</button>

// ✅ DO: Hide decorative elements from screen readers
<div aria-hidden="true">
  <DecorativeGraphic />
</div>

// ✅ DO: Mark main content area
<main role="main" id="main-content">
  <ContentView />
</main>
```

### Keyboard Navigation

```tsx
// ✅ DO: Support keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter') selectItem();
  if (e.key === 'ArrowUp') moveFocusUp();
  if (e.key === 'ArrowDown') moveFocusDown();
};

// ✅ DO: Ensure tab order is logical
<button tabIndex={0}>First</button>
<button tabIndex={0}>Second</button>
```

### Skip Links

For keyboard users, provide skip links:

```tsx
// Already implemented in App.tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

## Animation Guidelines

### Reduced Motion Support

**Always respect `prefers-reduced-motion`:**

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3
      }}
    >
      Content
    </motion.div>
  );
}
```

### CSS Animations

```css
/* ✅ DO: Use CSS variables for durations */
.animated {
  transition: transform var(--transition-normal);
}

/* Global reduced motion support is already in global.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Guidelines

### Debouncing User Input

Use `useDebounce` for expensive operations:

```tsx
import { useDebounce } from '@/hooks/useDebounce';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // Use debouncedQuery for expensive operations
  const results = useMemo(() => {
    return searchData(debouncedQuery);
  }, [debouncedQuery]);
}
```

### Persistent Preferences

Use `useLocalStorage` for user preferences:

```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

function MyComponent() {
  const [preference, setPreference] = useLocalStorage('key', 'default');
  // Automatically syncs with localStorage
}
```

### Image Error Handling

All images should handle loading errors:

```tsx
<img
  src={imageSrc}
  alt={altText}
  onError={(e) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  }}
/>
```

## URL Routing Guidelines

### Route Structure

All navigation should sync with URLs:

```tsx
// ✅ DO: Use React Router for navigation
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/folder/123');
  };
}
```

### URL Patterns

Follow these URL conventions:
- Home: `/`
- Folders: `/folder/{id}` or `/folder/{parent}/{child}`
- Pages: `/page/{id}`

## Testing Guidelines (Future)

When tests are added:

```tsx
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with correct text', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('is keyboard accessible', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

## Questions?

If you have questions about these guidelines, please:
1. Check the [CHANGELOG.md](./CHANGELOG.md) for recent changes (2025-11-06)
2. Check the [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed architecture info
3. Check existing code for examples
4. Open a discussion on GitLab

Thank you for contributing!
