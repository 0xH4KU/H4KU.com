import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
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
});
