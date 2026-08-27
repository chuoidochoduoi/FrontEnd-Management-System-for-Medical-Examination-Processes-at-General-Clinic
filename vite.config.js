import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Thay thế __dirname cho ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('html5-qrcode') || id.includes('/qrcode/')) return 'qr';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@stomp') || id.includes('sockjs')) return 'realtime';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/')) return 'react-vendor';
        },
      },
    },
  },
});
