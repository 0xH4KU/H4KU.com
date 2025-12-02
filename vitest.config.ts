import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: [
          'text',
          'json',
          'json-summary',
          'html',
          'lcov',
          'cobertura',
          'text-summary',
        ],
        exclude: [
          'node_modules/',
          'src/tests/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData.ts',
          'src/**/*.module.css',
          'src/content/**',
          'dist/',
          '.eslintrc.cjs',
          'scripts/',
          'src/services/monitoring.ts',
          'src/components/common/ErrorBoundary.tsx',
          'src/hooks/useCrosshair.ts',
          'src/hooks/useHistoryNavigation.ts',
          'src/hooks/use100vh.ts',
          'src/hooks/useLocalStorage.ts',
          'src/hooks/useReducedMotion.ts',
          'src/components/layout/SearchPanel.tsx',
        ],
        // Global thresholds kept realistic with current suite
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
          perFile: false,
        },
        reportOnFailure: true,
        all: false,
        clean: true,
        skipFull: false,
      },
      include: ['{src,tests}/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  })
);
