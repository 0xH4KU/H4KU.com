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
          'src/hooks/useCrosshair.ts',
          'src/hooks/useHistoryNavigation.ts',
          'src/hooks/use100vh.ts',
          'src/hooks/useLocalStorage.ts',
          'src/hooks/useReducedMotion.ts',
          'src/components/layout/SearchPanel.tsx',
        ],
        // Global thresholds kept realistic with current suite
        thresholds: {
          lines: 75,
          functions: 75,
          branches: 70,
          statements: 75,
          perFile: false,
        },
        reportOnFailure: true,
        all: false,
        clean: true,
        skipFull: false,
      },
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  })
);
