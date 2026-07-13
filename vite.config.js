import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the local Wrangler dev server during `npm run dev`.
    // Run `npx wrangler dev` (serves the Worker on port 8787) alongside `npm run dev`
    // for full-stack local testing, or just run `npm start`.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
