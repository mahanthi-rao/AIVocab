import { handleGenerate } from '../../src/server/generate.js';

// Thin Cloudflare Pages Function wrapper around the shared handler, so the app
// can also be deployed as a Pages project if desired. The Worker entry
// (worker/index.js) uses the same handler.
export const onRequestPost = ({ request, env }) => handleGenerate(request, env);
