import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

const host = process.env.TAURI_DEV_HOST ?? '127.0.0.1';

export default defineConfig({
  root: 'src/renderer',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
    },
  },
  server: {
    host,
    port: 1420,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host,
      port: 1421,
    },
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
