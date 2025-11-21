# Testing Guide

_Testing philosophy, tooling, and expectations for Lum.bio._

## 1. Overview

- **Runner**: Vitest 4 (jsdom)
- **Library**: React Testing Library (`@testing-library/react` + `@testing-library/user-event`)
- **Suite size**: small smoke suite (expand as you add features)
- **Coverage**: 75% global thresholds (lines/functions/statements), 70% branches
- **Philosophy**: test behaviours, not implementation details; keep suites fast and deterministic.

## 2. Directory Layout

```
src/
├── hooks/
│   ├── useLocalStorage.ts
│   └── __tests__/useLocalStorage.test.ts
├── utils/
│   ├── navigation.ts
│   ├── integrity.ts
│   └── __tests__/
│       ├── navigation.test.ts
│       └── integrity.test.ts
├── contexts/
│   └── __tests__/*.test.tsx
└── tests/
    ├── setup.ts       # global Vitest config (jsdom, mocks)
    └── utils.tsx      # helpers like renderWithProviders()
```

Keep tests next to the code they validate inside a `__tests__` folder. Name files `*.test.ts` or `*.test.tsx` depending on whether JSX is required.

## 3. Commands

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `npm test`              | Watch mode (ideal for TDD)          |
| `npm run test:run`      | Single CI-friendly pass             |
| `npm run test:coverage` | Generates reports under `coverage/` |
| `npm run test:ui`       | Launches the Vitest UI dashboard    |

Additional CLI tips (watch mode):

```
a – rerun all tests
f – rerun failed tests
p – filter by filename
t – filter by test name
q – quit
```

## 4. Writing Tests

### Hooks

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('waits for the specified delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'init' } }
    );

    rerender({ value: 'next' });
    expect(result.current).toBe('init');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('next');
  });
});
```

### Components / Contexts

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPanel from '@/components/layout/SearchPanel';
import { SearchProvider } from '@/contexts/SearchContext';

it('closes when Escape is pressed', async () => {
  render(
    <SearchProvider>
      <SearchPanel />
    </SearchProvider>
  );

  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Utilities

```ts
import { describe, it, expect } from 'vitest';
import { buildNavigationMap } from '../navigation';

describe('buildNavigationMap', () => {
  it('provides O(1) folder lookups', () => {
    const map = buildNavigationMap([
      { id: 'featured', name: 'Featured', type: 'folder' },
    ]);
    expect(map.byId.get('featured')?.name).toBe('Featured');
  });
});
```

## 5. Best Practices

1. **Arrange → Act → Assert** – keep each phase visually distinct.
2. **No implementation coupling** – assert rendered output, DOM attributes, and event effects rather than internal state.
3. **Use helpers** – `renderWithProviders` pre-wires all context providers; prefer it over manual nesting.
4. **Mock smartly** – mock network/storage only when necessary. Avoid mocking React hooks or internal utilities unless absolutely required.
5. **Respect accessibility** – when adding UI, tests should validate focus handling, ARIA labels, and keyboard flows.
6. **Cover integrity checks** – when touching the content pipeline or tamper UX, update `src/utils/__tests__/integrity.test.ts` and `src/components/layout/__tests__/StatusBar.test.tsx` so checksum regressions are caught in CI.
7. **Clean up timers** – if you call `vi.useFakeTimers()`, restore them in `afterEach`.
8. **Mind coverage thresholds** – the suite enforces ~75% globally; add focused tests rather than raising thresholds prematurely.

## 6. Troubleshooting

| Symptom          | Fix                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Tests hang on CI | Ensure no `setTimeout` is left unresolved; use `vi.useFakeTimers()` and advance appropriately. |
| Random failures  | Avoid relying on animation delays—prefer deterministic `act()` patterns.                       |
| DOM not updating | Wrap state updates in `act()` when manually triggering hook callbacks.                         |
| Coverage drop    | Run `npm run test:coverage` and inspect `coverage/coverage-summary.json` for culprits.         |

For deeper architectural context or CI details, refer to `DEVELOPMENT.md` and `docs/CI_GUIDE.md`.
