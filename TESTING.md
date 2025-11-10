# Testing Guide

This document provides detailed guidelines for writing and maintaining tests in the Lum.bio portfolio project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

We use **Vitest** as our test runner and **React Testing Library** for component testing. Our testing philosophy focuses on:

- Testing behavior over implementation details
- Writing maintainable, readable tests
- Maintaining high coverage (80%+ target)
- Fast, reliable test execution

### Current Coverage

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Config   | 1     | 8     | 100%     |
| Hooks    | 7     | 74    | 94.59%   |
| Utils    | 3     | 73    | 97.16%   |
| **Total**| **11**| **147**| **95.8%**|

## Test Structure

### Directory Layout

```
src/
├── hooks/
│   ├── __tests__/
│   │   ├── useDebounce.test.ts
│   │   ├── useLocalStorage.test.ts
│   │   └── ...
│   ├── useDebounce.ts
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── navigation.test.ts
│   │   ├── sortHelpers.test.ts
│   │   └── frontmatter.test.ts
│   └── ...
└── tests/
    ├── setup.ts        # Global test setup
    └── utils.tsx       # Test utilities
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test file location: `__tests__/` folder next to source files
- Test suites: Match the filename of the code being tested
- Test cases: Use descriptive `should` statements

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Open interactive UI
npm run test:ui

# Run specific test file
npm test -- useDebounce.test.ts

# Run tests matching a pattern
npm test -- --grep="should handle"
```

### Watch Mode

In watch mode, Vitest automatically reruns tests when files change:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

## Writing Tests

### Hook Tests

Use `@testing-library/react` for testing hooks:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Should still show old value before delay
    expect(result.current).toBe('initial');

    // Fast forward timers
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now show new value
    expect(result.current).toBe('updated');
  });
});
```

### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = `---
title: Test Post
author: John Doe
---
This is the content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Test Post',
      author: 'John Doe',
    });
    expect(result.content).toBe('This is the content.');
  });

  it('should handle edge cases', () => {
    const content = 'Just plain content';
    const result = parseFrontmatter(content);

    expect(result.data).toEqual({});
    expect(result.content).toBe(content);
  });
});
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing implementation details
```typescript
it('should call useState', () => {
  const useStateSpy = vi.spyOn(React, 'useState');
  renderHook(() => useMyHook());
  expect(useStateSpy).toHaveBeenCalled();
});
```

✅ **Good**: Testing behavior
```typescript
it('should update value when setValue is called', () => {
  const { result } = renderHook(() => useMyHook());
  act(() => result.current.setValue(5));
  expect(result.current.value).toBe(5);
});
```

### 2. Use Descriptive Test Names

❌ **Bad**
```typescript
it('works', () => { ... });
it('test 1', () => { ... });
```

✅ **Good**
```typescript
it('should return empty string for null input', () => { ... });
it('should debounce multiple rapid updates', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should sort items by label', () => {
  // Arrange: Set up test data
  const items = [
    { label: '10-item' },
    { label: '2-item' },
    { label: '1-item' },
  ];

  // Act: Perform the action
  const sorted = sortByLabel(items, 'asc', (item) => item.label);

  // Assert: Verify the result
  expect(sorted.map(i => i.label)).toEqual(['1-item', '2-item', '10-item']);
});
```

### 4. Always Use `act()` for State Updates

❌ **Bad**
```typescript
vi.advanceTimersByTime(500);
expect(result.current).toBe('updated');
```

✅ **Good**
```typescript
act(() => {
  vi.advanceTimersByTime(500);
});
expect(result.current).toBe('updated');
```

### 5. Clean Up After Tests

```typescript
describe('useWindowSize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  // tests...
});
```

## Common Patterns

### Mocking `window.matchMedia`

```typescript
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
```

### Mocking `localStorage`

```typescript
beforeEach(() => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock as unknown as Storage;
});
```

### Testing with Context Providers

Use the `renderWithProviders` helper from `src/tests/utils.tsx`:

```typescript
import { renderWithProviders } from '@/tests/utils';

it('should work with context', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useAsyncHook());

  // Trigger async operation
  act(() => {
    result.current.fetchData();
  });

  // Wait for update
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.doSomethingThatFails();
  });

  expect(result.current.error).toBeDefined();
  expect(consoleSpy).toHaveBeenCalled();

  consoleSpy.mockRestore();
});
```

## Troubleshooting

### Common Issues

#### Issue: "An update was not wrapped in act()"

**Cause**: State updates happening outside of `act()`

**Solution**: Wrap timer advances and state updates:
```typescript
act(() => {
  vi.advanceTimersByTime(500);
});
```

#### Issue: "TypeError: Failed to construct 'StorageEvent'"

**Cause**: jsdom doesn't fully support StorageEvent constructor

**Solution**: Use generic Event with defineProperty:
```typescript
const storageEvent = new Event('storage');
Object.defineProperty(storageEvent, 'key', { value: 'test-key' });
Object.defineProperty(storageEvent, 'newValue', { value: 'new-value' });
window.dispatchEvent(storageEvent);
```

#### Issue: Tests failing with `-0 !== 0`

**Cause**: Object.is() distinguishes between -0 and 0

**Solution**: Use `==` instead of `===` or `.toBe()`:
```typescript
expect(comparator('same', 'same') == 0).toBe(true);
```

#### Issue: "Cannot delete property 'window' of #<Object>"

**Cause**: Trying to delete global.window in jsdom

**Solution**: Skip SSR tests in jsdom environment or use separate test config

### Getting Help

1. Check the [Vitest documentation](https://vitest.dev/)
2. Check [React Testing Library docs](https://testing-library.com/react)
3. Look at existing tests for patterns
4. Ask in team chat or open an issue

## Coverage Goals

- **Minimum threshold**: 70% (enforced by CI)
- **Target coverage**: 80%+
- **Current coverage**: 95.8%

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

The coverage report shows:
- Line coverage: How many lines were executed
- Branch coverage: How many code branches were taken
- Function coverage: How many functions were called
- Statement coverage: How many statements were executed

## CI Integration

Tests run automatically on:
- Every push to any branch
- Every merge request

CI configuration (`.gitlab-ci.yml`):
```yaml
lint-and-test:
  script:
    - npm run test:run
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Next Steps

- [ ] Add component tests for key UI components
- [ ] Add integration tests for user flows
- [ ] Set up E2E tests with Playwright
- [ ] Add visual regression testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI](https://vitest.dev/guide/ui.html)
