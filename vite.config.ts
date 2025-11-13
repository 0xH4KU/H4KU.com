import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
// Temporarily disable sitemap plugin due to robots.txt file access issues in CF Pages
// import sitemap from 'vite-plugin-sitemap';

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
    // Temporarily disabled due to CF Pages build issues
    // sitemap({
    //   hostname: 'https://lum.bio',
    //   dynamicRoutes: [
    //     '/',
    //     '/folder/2024',
    //     '/folder/2025',
    //     '/folder/featured',
    //     '/page/about',
    //     '/page/contact',
    //   ],
    //   robots: [
    //     {
    //       userAgent: '*',
    //       allow: '/',
    //     },
    //   ],
    // }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 優化 bundle 大小
    rollupOptions: {
      output: {
        // 手動分包
        manualChunks: {
          // React 相關庫打包在一起
          'react-vendor': ['react', 'react-dom'],
          // 動畫庫單獨打包
          'animation-vendor': ['framer-motion'],
          // Icons 單獨打包
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    // 設置 chunk 大小警告閾值
    chunkSizeWarningLimit: 500,
    // 啟用 source map（生產環境可選）
    sourcemap: false,
  },
  // 優化依賴預構建
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
  // 開發伺服器配置
  server: {
    host: '0.0.0.0', // 或使用 true，允許網路訪問
    port: 5173,
    strictPort: false,
  },
});
