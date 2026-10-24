import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
      '/dishes': { target: 'http://127.0.0.1:8787', changeOrigin: true },
      '/brand': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
