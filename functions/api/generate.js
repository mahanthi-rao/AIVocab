import {
  buildPrompt,
  CATEGORIES,
  clampQuestionCount,
  DEFAULT_QUESTION_COUNT,
} from '../../src/prompts.js';

// `gemini-flash-latest` is an always-current alias so the app keeps working as
// Google rotates model versions. Change this to pin a specific version if needed.
const MODEL = 'gemini-flash-latest';
const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.id));
const VALID_MODES = new Set(['content', 'test']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Transient statuses that are worth retrying (overloaded / rate limited / gateway).
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Call Gemini with a few retries and exponential backoff for transient errors.
async function fetchGeminiWithRetry(url, options, maxAttempts = 4) {
  let lastRes = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res;
    try {
      res = await fetch(url, options);
    } catch {
      // Network-level failure: retry unless this was the last attempt.
      if (attempt === maxAttempts - 1) throw new Error('network');
      await sleep(2 ** attempt * 500);
      continue;
    }

    if (res.ok || !RETRYABLE.has(res.status)) return res;

    lastRes = res;
    if (attempt < maxAttempts - 1) {
      // Backoff: 0.5s, 1s, 2s (+ jitter).
      await sleep(2 ** attempt * 500 + Math.floor(Math.random() * 250));
    }
  }
  return lastRes;
}

// Gemini sometimes wraps JSON in ```json ... ``` fences despite instructions.
function parseModelJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function onRequestPost({ request, env }) {
  // Prefer a user-supplied key (sent from the browser) over the server key.
  const userKey = request.headers.get('x-gemini-key');
  const apiKey = (userKey && userKey.trim()) || env.GEMINI_API_KEY;

  if (!apiKey) {
    return json(
      {
        error:
          'No Gemini API key available. Enter your key in the app, or set GEMINI_API_KEY on the server.',
      },
      400
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON in request body.' }, 400);
  }

  const word = String(payload?.word || '').trim();
  const category = String(payload?.category || '').trim();
  const mode = String(payload?.mode || 'content').trim();
  const count =
    payload?.count == null || payload.count === ''
      ? DEFAULT_QUESTION_COUNT
      : clampQuestionCount(payload.count);

  if (!word) return json({ error: 'A word or phrase is required.' }, 400);
  if (!VALID_CATEGORIES.has(category))
    return json({ error: 'Unknown category.' }, 400);
  if (!VALID_MODES.has(mode)) return json({ error: 'Unknown mode.' }, 400);

  const prompt = buildPrompt(word, category, mode, count);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  // Give the thinking model enough room; scale with the number of questions.
  const maxOutputTokens =
    mode === 'test' ? Math.min(32768, 4096 + count * 1400) : 8192;

  const requestOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        // Newer "thinking" models spend tokens reasoning before answering;
        // a generous cap keeps the JSON answer from being truncated.
        maxOutputTokens,
      },
    }),
  };

  let geminiRes;
  try {
    geminiRes = await fetchGeminiWithRetry(url, requestOptions);
  } catch {
    return json({ error: 'Could not reach the Gemini API. Please try again.' }, 502);
  }

  if (!geminiRes || !geminiRes.ok) {
    const status = geminiRes?.status;
    const detail = geminiRes ? await geminiRes.text().catch(() => '') : '';
    // 503/429 mean the model is overloaded or rate limited even after retries.
    const overloaded = status === 503 || status === 429;
    return json(
      {
        error: overloaded
          ? 'Gemini is busy right now (overloaded). Please wait a few seconds and try again.'
          : `Gemini API error (${status ?? 'no response'}).`,
        detail: detail.slice(0, 500),
      },
      overloaded ? 503 : 502
    );
  }

  let apiData;
  try {
    apiData = await geminiRes.json();
  } catch {
    return json({ error: 'Gemini returned an unreadable response.' }, 502);
  }

  const candidate = apiData?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts
    .map((p) => p?.text || '')
    .join('')
    .trim();

  if (!text) {
    const reason =
      apiData?.promptFeedback?.blockReason || candidate?.finishReason;
    return json(
      {
        error: reason
          ? `Gemini returned no usable content (${reason}).`
          : 'Gemini returned no content.',
      },
      502
    );
  }

  let result;
  try {
    result = parseModelJson(text);
  } catch {
    return json({ error: 'Gemini did not return valid JSON. Please try again.' }, 502);
  }

  // Ensure the category id round-trips so the UI can label it correctly.
  if (!result.category) result.category = category;

  return json(result);
}
