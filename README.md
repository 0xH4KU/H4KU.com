# Lum.bio Portfolio

A modern, interactive portfolio website built with React, TypeScript, and Vite. Features a unique file-system inspired navigation interface with dark/light theme support.

## Features

### Core Features
- **File System Navigation**: Browse portfolio content through an intuitive folder/file interface
- **Dark/Light Theme**: Automatic theme detection with manual toggle support
- **Responsive Design**: Optimized for desktop and mobile viewing
- **URL Routing**: Deep linking support - all pages and folders have shareable URLs
- **Resizable Sidebar**: Customizable navigation panel width with persistent preferences

### Image Gallery
- **Image Lightbox**: Full-screen image viewer with gallery navigation
- **Keyboard Navigation**: Use arrow keys (←/→) to browse images, ESC to close
- **Image Counter**: See your position in the gallery (e.g., "3 / 10")
- **Error Handling**: Graceful fallback for failed image loads

### Search & Discovery
- **Quick Search**: Fast search across folders, images, and text files
- **Keyboard Navigation**: Navigate search results with arrow keys, Enter to select
- **Debounced Input**: Smooth, performant search experience

### Accessibility & UX
- **WCAG Compliant**: Focus indicators, skip links, and ARIA labels
- **Reduced Motion Support**: Respects user's motion preferences
- **Keyboard Friendly**: Full keyboard navigation support
- **Screen Reader Optimized**: Proper semantic HTML and ARIA attributes

### Developer Tools
- **Crosshair Tool**: Precise pixel alignment helper for designers
- **Test Suite**: Comprehensive testing with 95.2% coverage (175 tests)
- **Type Safety**: Full TypeScript coverage with strict mode enabled

## Tech Stack

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.4.5
- **Build Tool**: Vite 7.1.12
- **Testing**: Vitest 4.0.8 + React Testing Library
- **Icons**: lucide-react
- **Styling**: CSS Modules (modular, scoped styles)
- **Routing**: React Router (client-side routing)
- **State Management**: React Context API + Custom Hooks

## Project Structure

```
src/
├── components/         # React components
│   ├── layout/        # Layout components (Sidebar, TopBar, StatusBar)
│   ├── content/       # Content display components
│   └── overlay/       # Modal/overlay components (Lightbox, Crosshair)
├── config/            # Application configuration constants
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
│   └── __tests__/    # Hook unit tests (71 tests, 93.12% coverage)
├── content/           # Static portfolio content (markdown, JSON)
│   ├── pages/        # Markdown pages with frontmatter
│   ├── folders/      # Folder structure definitions
│   ├── works/        # Portfolio works/projects
│   └── socials/      # Social media links
├── data/              # Static portfolio data
├── styles/            # CSS Modules
├── tests/             # Test setup and utilities
│   ├── setup.ts      # Global test configuration
│   └── utils.tsx     # Test helper functions (renderWithProviders)
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   └── __tests__/    # Utils unit tests (73 tests, 97.16% coverage)
└── assets/            # Static assets (images, fonts)
```

## Getting Started

### Prerequisites

- Node.js 18+ or later
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-gitlab-repository-url>
cd lum.bio
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode (alias)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier

## Testing

This project uses **Vitest** and **React Testing Library** for testing. We maintain high test coverage across hooks, utilities, and components.

### Test Coverage

Current test coverage: **95.2%** overall

| Category | Coverage | Tests |
|----------|----------|-------|
| Config   | 100%     | Full coverage |
| Hooks    | 93.12%   | 71 tests |
| Utils    | 97.16%   | 73 tests |

### Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run all tests once (CI mode)
npm run test:run

# Open Vitest UI in browser
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Files Location

- **Hook tests**: `src/hooks/__tests__/*.test.ts`
- **Utils tests**: `src/utils/__tests__/*.test.ts`
- **Component tests**: `src/components/__tests__/*.test.tsx` (coming soon)
- **Test setup**: `src/tests/setup.ts` - Global test configuration
- **Test utils**: `src/tests/utils.tsx` - Helper functions like `renderWithProviders`

### Writing Tests

Tests follow these conventions:

1. **Naming**: Use descriptive test names with `should` statements
2. **Structure**: Arrange-Act-Assert pattern
3. **Mocking**: Use Vitest's `vi.mock()` for external dependencies
4. **Async**: Always use `act()` for state updates in React tests
5. **Coverage**: Aim for 80%+ coverage for new code

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('should update value when called', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue(5);
    });

    expect(result.current.value).toBe(5);
  });
});
```

### CI Integration

Tests run automatically on every push via GitLab CI:
- All tests must pass before merge
- Coverage reports are generated and tracked
- Coverage threshold: 70% minimum

## 📝 Content Management

All content lives in the repository so you only need a text editor:

- **Pages**: `src/content/pages/*.md` (supports frontmatter + markdown body)
- **Folders**: `src/content/folders/*.json`
- **Works**: `src/content/works/*.json`
- **Social Links**: `src/content/socials/*.json`

Update these files directly and re-run `npm run dev` to preview changes. No external CMS or admin UI is required.

## Deployment

This project is configured for deployment on **Cloudflare Pages**.

### Deploy to Cloudflare Pages

1. Push your code to GitLab
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Create a new project and connect your GitLab repository
4. Use the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Environment variables**: Set EmailJS variables in Cloudflare Pages settings

The site will automatically deploy on every push to the main branch.

### Manual Deployment

You can also deploy manually using Wrangler:

```bash
npm run build
npx wrangler pages deploy dist
```

## Development Guidelines

Please read the following documents for development guidelines:

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Code standards and contribution guidelines
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed architecture and development patterns
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide and best practices
- **[agent.md](./agent.md)** - AI collaboration guidelines

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## License

All rights reserved.

## Contact

For questions or feedback, please open an issue on GitLab.
