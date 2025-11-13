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
        reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
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
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
);
