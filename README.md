# SSC CGL 2026 Vocabulary Practice App

A single-page web app to practice English vocabulary for the SSC CGL 2026 exam.
Type a word (e.g. `slipshod`), pick a category, and use Google Gemini to either
generate study notes or an interactive practice test.

- **Frontend:** React + Vite (built to `dist/`, served as Cloudflare static assets)
- **Backend:** a Cloudflare Worker (`worker/index.js`) that handles `/api/generate`
  and proxies Gemini, so your API key never reaches the browser. The shared handler
  lives in `src/server/generate.js` (also re-used by a Pages Function wrapper).
- **Hosting:** Cloudflare Workers (with static assets), deployed from GitHub

## Categories

Synonyms, Antonyms, One Word Substitutions (OWS), Idioms, Homonyms,
Fixed Prepositions, Phrasal Verbs.

## How it works

```
Browser (React)  ->  POST /api/generate  ->  Cloudflare Worker  ->  Gemini API
```

The Worker reads `GEMINI_API_KEY` from the environment (a Cloudflare secret in
production, `.dev.vars` locally) and returns structured JSON that the UI renders
as study cards or an interactive MCQ test.

## Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file:

   ```bash
   cp .dev.vars.example .dev.vars
   # then edit .dev.vars and paste your GEMINI_API_KEY
   ```

3. Run the full stack (UI + API) with Wrangler:

   ```bash
   npm start
   ```

   This builds the app and serves it (with the `/api/generate` Worker) at the
   URL Wrangler prints (usually `http://127.0.0.1:8787`).

### UI-only hot reload (optional)

For fast UI iteration you can run Vite and Wrangler side by side:

```bash
# terminal 1 - serves the Worker + assets on port 8787
npx wrangler dev --port 8787

# terminal 2 - Vite dev server; /api is proxied to 8787 (see vite.config.js)
npm run dev
```

## Deploy to Cloudflare (via GitHub)

Configuration lives in [`wrangler.jsonc`](wrangler.jsonc): it sets the Worker
entry (`worker/index.js`) and serves the built `dist/` folder as static assets.

1. Push this project to a GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: SSC CGL vocab app"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Workers ->
   Import a repository** (Git) and select your repo. Cloudflare runs
   `npm run build` then `npx wrangler deploy` using `wrangler.jsonc`.

3. Add the secret: project **Settings -> Variables and Secrets** ->
   add `GEMINI_API_KEY`.

4. Deploy. Every push to `main` triggers an automatic deployment.

> The `name` in `wrangler.jsonc` (`aivocab`) should match your Worker's name.
> You can also deploy manually from your machine with `npm run deploy`.

## Using your own key from the app (no server key needed)

The app has an optional **Gemini API key** field (under the buttons). If you paste
your key there, it is stored only in your browser (`localStorage`) and sent with
each request via the `x-gemini-key` header, which the function uses instead of the
server key. This means you can leave `GEMINI_API_KEY` unset / delete `.dev.vars`
entirely and just enter the key in the UI. Leave the field blank to fall back to
the server key.

## Notes

- The Gemini model is set to `gemini-flash-latest` (an always-current alias) in
  [`src/server/generate.js`](src/server/generate.js) and can be changed there.
  Note: the specific version `gemini-2.5-flash` is blocked for newer API keys, so
  the `-latest` alias is used for reliability.
- No word list or database is stored; every result is generated on demand.
