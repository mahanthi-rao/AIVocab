import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the local Wrangler Pages dev server during `npm run dev`.
    // Run `npx wrangler pages dev dist --port 8788` alongside `npm run dev` for full-stack local testing.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
});
