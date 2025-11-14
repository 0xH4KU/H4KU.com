import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import sitemap from 'vite-plugin-sitemap';

type AggregatedFolderRecord = {
  id?: string;
  parentId?: string | null;
  hidden?: boolean;
};

type AggregatedPageRecord = {
  id?: string;
  filename?: string;
  folderId?: string | null;
};

type AggregatedContentFile = {
  folders?: AggregatedFolderRecord[];
  pages?: AggregatedPageRecord[];
};

const FALLBACK_ROUTES = [
  '/',
  '/folder/featured',
  '/page/about',
  '/page/contact',
];

const aggregatedContentPath = fileURLToPath(
  new URL('./src/content/_aggregated.json', import.meta.url)
);

const readAggregatedContent = (): AggregatedContentFile | null => {
  try {
    if (!fs.existsSync(aggregatedContentPath)) {
      return null;
    }
    const raw = fs.readFileSync(aggregatedContentPath, 'utf-8');
    return JSON.parse(raw) as AggregatedContentFile;
  } catch (error) {
    console.warn(
      '[vite-config] Unable to read aggregated content for sitemap generation:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

const buildFolderRoutes = (
  folders: AggregatedFolderRecord[] = []
): string[] => {
  const folderMap = new Map<string, AggregatedFolderRecord>();
  folders.forEach(folder => {
    if (folder?.id) {
      folderMap.set(folder.id, folder);
    }
  });

  const routes = new Set<string>();

  folderMap.forEach(folder => {
    if (!folder.id || folder.hidden) {
      return;
    }

    const segments: string[] = [];
    let current: AggregatedFolderRecord | undefined = folder;
    const visited = new Set<string>();
    let blocked = false;

    while (current) {
      if (!current.id || current.hidden) {
        blocked = true;
        break;
      }
      segments.unshift(current.id);

      const parentId =
        typeof current.parentId === 'string' && current.parentId.trim().length
          ? current.parentId.trim()
          : null;

      if (!parentId) {
        break;
      }

      if (visited.has(parentId)) {
        console.warn(
          `[vite-config] Circular folder reference detected for "${current.id}".`
        );
        blocked = true;
        break;
      }
      visited.add(parentId);

      const parent = folderMap.get(parentId);
      if (!parent) {
        console.warn(
          `[vite-config] Missing parent "${parentId}" for folder "${current.id}".`
        );
        blocked = true;
        break;
      }
      current = parent;
    }

    if (!blocked && segments.length) {
      routes.add(`/folder/${segments.join('/')}`);
    }
  });

  return Array.from(routes);
};

const sanitizePageSlug = (page: AggregatedPageRecord): string | null => {
  if (typeof page.id === 'string' && page.id.trim().length) {
    return page.id.trim();
  }

  if (typeof page.filename === 'string' && page.filename.trim().length) {
    const trimmed = page.filename.trim();
    return trimmed.replace(/\.[^/.]+$/, '');
  }

  return null;
};

const buildPageRoutes = (pages: AggregatedPageRecord[] = []): string[] => {
  const routes = new Set<string>();

  pages.forEach(page => {
    if (page?.folderId) {
      return;
    }
    const slug = sanitizePageSlug(page);
    if (slug) {
      routes.add(`/page/${slug}`);
    }
  });

  return Array.from(routes);
};

const getDynamicRoutes = (): string[] => {
  const content = readAggregatedContent();
  if (!content) {
    return FALLBACK_ROUTES;
  }

  const routes = new Set<string>(['/']);
  buildFolderRoutes(content.folders ?? []).forEach(route => routes.add(route));
  buildPageRoutes(content.pages ?? []).forEach(route => routes.add(route));

  return Array.from(routes);
};

const dynamicRoutes = getDynamicRoutes();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ViteImageOptimizer({
    //   png: {
    //     quality: 85,
    //   },
    //   jpeg: {
    //     quality: 85,
    //   },
    //   jpg: {
    //     quality: 85,
    //   },
    //   webp: {
    //     quality: 85,
    //   },
    // }),
    sitemap({
      hostname: 'https://lum.bio',
      dynamicRoutes,
      readable: true,
      // CF Pages serves robots.txt from /public so avoid clobbering it here.
      generateRobotsTxt: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        // Manual chunk configuration
        manualChunks: {
          // Group React libraries together
          'react-vendor': ['react', 'react-dom'],
          // Split animation library
          'animation-vendor': ['framer-motion'],
          // Split icon library
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // Configure chunk size warning threshold
    chunkSizeWarningLimit: 500,
    // Enable source map (optional for production)
    sourcemap: false,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
  // Development server configuration
  server: {
    host: '0.0.0.0', // Use true to mirror this behavior while allowing network access
    port: 5173,
    strictPort: false,
  },
});
