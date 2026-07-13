// Shared prompt logic used by both the UI (metadata) and the Cloudflare Pages
// Function (server-side prompt building). Keep this file free of browser- or
// worker-specific APIs so it can be imported in both environments.

export const CATEGORIES = [
  { id: 'synonyms', label: 'Synonyms', short: 'Synonym' },
  { id: 'antonyms', label: 'Antonyms', short: 'Antonym' },
  { id: 'ows', label: 'One Word Substitutions (OWS)', short: 'One Word Substitution' },
  { id: 'idioms', label: 'Idioms', short: 'Idiom' },
  { id: 'homonyms', label: 'Homonyms', short: 'Homonym' },
  { id: 'prepositions', label: 'Fixed Prepositions', short: 'Fixed Preposition' },
  { id: 'phrasal_verbs', label: 'Phrasal Verbs', short: 'Phrasal Verb' },
];

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
);

const CATEGORY_SHORT = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.short])
);

export function categoryLabel(id) {
  return CATEGORY_LABELS[id] || id;
}

export function categoryShort(id) {
  return CATEGORY_SHORT[id] || CATEGORY_LABELS[id] || id;
}

// Per-category guidance that gets injected into both content and test prompts so
// the model focuses on the aspect relevant to the selected category.
const CATEGORY_FOCUS = {
  synonyms:
    'Focus on words with the same or nearly the same meaning as the target word. Include SSC-CGL-frequency synonyms.',
  antonyms:
    'Focus on words that are opposite in meaning to the target word.',
  ows:
    'Treat the target as either a one-word substitution or the phrase it substitutes. Give the single word that means the described idea, and the definition/phrase it replaces.',
  idioms:
    'Treat the target as an idiom or part of one. Explain the figurative meaning, not the literal one, and give realistic usage.',
  homonyms:
    'Focus on words that sound alike or are spelled alike but differ in meaning (homophones/homographs). Distinguish the meanings clearly.',
  prepositions:
    'Focus on the fixed/dependent preposition(s) that correctly follow or precede the target word. Highlight the correct collocation and common wrong choices.',
  phrasal_verbs:
    'Treat the target as a phrasal verb (verb + particle). Explain the meaning(s), and note if there are multiple senses.',
};

function focusFor(categoryId) {
  return CATEGORY_FOCUS[categoryId] || '';
}

// JSON response schemas (documented in the prompt so the model returns
// predictable, parseable output). Kept as plain objects/text.
const CONTENT_SHAPE = `{
  "word": string,
  "category": string,
  "partOfSpeech": string,
  "difficulty": "easy" | "medium" | "hard",
  "meaning": string,
  "categoryNote": string,        // explanation specific to the selected category
  "synonyms": string[],          // 4-6 items ("" allowed if not applicable)
  "antonyms": string[],          // 4-6 items ("" allowed if not applicable)
  "relatedWords": string[],      // idioms/phrasal verbs/collocations/homonyms as relevant
  "examples": string[],          // 3 natural example sentences using the word
  "tip": string                  // one exam-oriented memory tip
}`;

const TEST_SHAPE = `{
  "word": string,
  "category": string,
  "questions": [
    {
      "question": string,       // a clear MCQ stem
      "options": string[],      // exactly 4 options
      "answerIndex": number,    // 0-based index of the correct option
      "explanation": string     // short reason the answer is correct
    }
  ]                             // one entry per requested question
}`;

export const DEFAULT_QUESTION_COUNT = 5;
export const MIN_QUESTION_COUNT = 1;
export const MAX_QUESTION_COUNT = 20;

export function clampQuestionCount(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_QUESTION_COUNT;
  return Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, n));
}

export function buildPrompt(word, categoryId, mode, count = DEFAULT_QUESTION_COUNT) {
  const label = categoryLabel(categoryId);
  const focus = focusFor(categoryId);
  const cleanWord = String(word || '').trim();
  const n = clampQuestionCount(count);

  const context =
    'You are an expert English teacher preparing candidates for the SSC CGL 2026 exam (India). ' +
    'Use vocabulary and question styles consistent with SSC CGL previous-year papers. ' +
    'Keep language clear and exam-appropriate. Return ONLY valid JSON, no markdown, no code fences.';

  if (mode === 'test') {
    const short = categoryShort(categoryId);
    return [
      context,
      `Target word/phrase: "${cleanWord}".`,
      `Selected category: ${label}.`,
      `Category focus: ${focus}`,
      `Create a practice test of exactly ${n} multiple-choice question(s) related to the target word and the selected category.`,
      'Each question must have exactly 4 options with exactly one correct answer.',
      `The "question" field must be written ONLY in the compact format "${short} : <Word>" (for example, "${short} : ${cleanWord || 'Slipshod'}"). Do NOT use full instructional sentences like "Select the most appropriate...". Just the label, a colon, and the word being tested.`,
      `Each question should test a different but related word from the same ${label.toLowerCase()} family as the target word, so the learner practises the whole word group.`,
      'The 4 options are candidate words; exactly one is the correct answer for that question.',
      `Respond as JSON matching this shape exactly:\n${TEST_SHAPE}`,
    ].join('\n');
  }

  // default: content
  return [
    context,
    `Target word/phrase: "${cleanWord}".`,
    `Selected category: ${label}.`,
    `Category focus: ${focus}`,
    'Produce concise, exam-ready study notes for this word focused on the selected category.',
    `Respond as JSON matching this shape exactly:\n${CONTENT_SHAPE}`,
  ].join('\n');
}
