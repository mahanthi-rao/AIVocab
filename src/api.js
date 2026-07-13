// Thin client for the Cloudflare Pages Function that proxies Gemini.
export async function generate({ word, category, mode, count, apiKey }) {
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers['x-gemini-key'] = apiKey;

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ word, category, mode, count }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.');
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data;
}
