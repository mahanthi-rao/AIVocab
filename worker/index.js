import { handleGenerate } from '../src/server/generate.js';

// Cloudflare Worker entry: serves the built static site from the ASSETS binding
// and handles the /api/generate endpoint. Configured in wrangler.jsonc.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/generate') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Use POST for this endpoint.' }), {
          status: 405,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
      }
      return handleGenerate(request, env);
    }

    // Everything else is a static asset (index.html, JS, CSS, favicon, ...).
    return env.ASSETS.fetch(request);
  },
};
