import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://j14d105.p.ssafy.io',
        changeOrigin: true,
      },
      '/bizno-api': {
        target: 'https://bizno.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bizno-api/, '/api/fapi'),
      },
    },
  },
});
