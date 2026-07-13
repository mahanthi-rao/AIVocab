import { useEffect, useState } from 'react';
import {
  CATEGORIES,
  DEFAULT_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
} from './prompts.js';
import { generate } from './api.js';
import ContentView from './components/ContentView.jsx';
import TestView from './components/TestView.jsx';

const API_KEY_STORAGE = 'gemini_api_key';
const THEME_STORAGE = 'theme';

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE);
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersLight =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

export default function App() {
  const [word, setWord] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [numQuestions, setNumQuestions] = useState('');
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(API_KEY_STORAGE) || ''
  );
  const [mode, setMode] = useState(null); // 'content' | 'test'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function updateApiKey(value) {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem(API_KEY_STORAGE, value.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  }

  async function run(nextMode) {
    const trimmed = word.trim();
    if (!trimmed) {
      setError('Please enter a word or phrase first.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    setMode(nextMode);
    try {
      const data = await generate({
        word: trimmed,
        category,
        mode: nextMode,
        count: numQuestions === '' ? undefined : Number(numQuestions),
        apiKey: apiKey.trim() || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    run('content');
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            // Sun icon (click to go light)
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <circle cx="12" cy="12" r="4.5" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1.5" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22.5" />
                <line x1="1.5" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22.5" y2="12" />
                <line x1="4.2" y1="4.2" x2="6" y2="6" />
                <line x1="18" y1="18" x2="19.8" y2="19.8" />
                <line x1="4.2" y1="19.8" x2="6" y2="18" />
                <line x1="18" y1="6" x2="19.8" y2="4.2" />
              </g>
            </svg>
          ) : (
            // Moon icon (click to go dark)
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
              />
            </svg>
          )}
        </button>
        <h1>
          <span className="logo">V</span> SSC CGL 2026 Vocabulary
        </h1>
        <p className="subtitle">
          AI-powered study notes and practice tests for English vocabulary.
        </p>
      </header>

      <form className="controls" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="word">Word or phrase</label>
          <input
            id="word"
            type="text"
            placeholder="e.g. slipshod"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="numQuestions">
            Number of questions <span className="optional">(optional, for test)</span>
          </label>
          <input
            id="numQuestions"
            type="number"
            inputMode="numeric"
            min={MIN_QUESTION_COUNT}
            max={MAX_QUESTION_COUNT}
            placeholder={`Default ${DEFAULT_QUESTION_COUNT}`}
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
          />
        </div>

        <div className="buttons">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => run('content')}
            disabled={loading}
          >
            {loading && mode === 'content' ? 'Generating...' : 'Generate Content'}
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => run('test')}
            disabled={loading}
          >
            {loading && mode === 'test' ? 'Generating...' : 'Generate Test'}
          </button>
        </div>

        <details className="apikey" open={!apiKey}>
          <summary>Gemini API key {apiKey ? '(saved in this browser)' : '(optional)'}</summary>
          <div className="field">
            <label htmlFor="apiKey">
              Paste your Gemini API key
              <span className="optional">
                {' '}
                stored only in this browser, sent directly to Gemini
              </span>
            </label>
            <input
              id="apiKey"
              type="password"
              placeholder="AIza... or your key"
              value={apiKey}
              onChange={(e) => updateApiKey(e.target.value)}
              autoComplete="off"
            />
            <p className="apikey-hint">
              If set, this key is used instead of the server key, so you don&apos;t
              need to keep one in <code>.dev.vars</code> or Cloudflare. Leave blank
              to use the server key.
            </p>
          </div>
        </details>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Asking Gemini to prepare your {mode === 'test' ? 'test' : 'content'}...</p>
        </div>
      )}

      {!loading && result && mode === 'content' && <ContentView data={result} />}
      {!loading && result && mode === 'test' && <TestView data={result} />}

      {!loading && !result && !error && (
        <div className="empty">
          <p>
            Enter a word, pick a category, and choose <strong>Generate Content</strong>{' '}
            for study notes or <strong>Generate Test</strong> for a quick quiz.
          </p>
        </div>
      )}

      <footer className="app-footer">
        <p>Built for SSC CGL 2026 preparation. Powered by Google Gemini.</p>
        <p className="credit">
          Developed by <strong>Mahanthi Rao Seera</strong>
          <span className="role">Software Developer</span>
        </p>
      </footer>
    </div>
  );
}
