import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        bundleCreate: 'bundle-create.html',
        bundleCreate2: 'bundle-create2.html',
        bundleCreate3: 'bundle-create3.html',
        bundleList: 'bundle-list.html',
        displayList: 'display-list.html',
        displayCreate: 'display-create.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4000',
    },
  },
});
