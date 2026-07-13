import { useMemo, useState } from 'react';
import { categoryShort } from '../prompts.js';

export default function TestView({ data }) {
  const questions = useMemo(() => data?.questions || [], [data]);
  // qIndex -> chosen optIndex. A question is "locked" once it's in here.
  const [answers, setAnswers] = useState({});

  if (!data || questions.length === 0) return null;

  const total = questions.length;
  const attempted = Object.keys(answers).length;
  const correct = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0
  );
  const wrong = attempted - correct;
  const allAnswered = attempted === total;

  function choose(qIndex, optIndex) {
    // Lock the answer on first click; ignore further clicks for that question.
    if (answers[qIndex] != null) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  function reset() {
    setAnswers({});
  }

  return (
    <div className="test">
      <div className="content-header">
        <h2 className="word-title">
          <span className="cat-name">{categoryShort(data.category)}</span>
          <span className="sep"> : </span>
          <span className="the-word">{data.word}</span>
        </h2>
      </div>

      <section className="scoreboard" aria-live="polite">
        <div className="score-item">
          <span className="score-num total-num">
            {correct}/{attempted || 0}
          </span>
          <span className="score-label">Score</span>
        </div>
        <div className="score-item">
          <span className="score-num correct-num">{correct}</span>
          <span className="score-label">Correct</span>
        </div>
        <div className="score-item">
          <span className="score-num wrong-num">{wrong}</span>
          <span className="score-label">Wrong</span>
        </div>
        <div className="score-item">
          <span className="score-num">
            {attempted}/{total}
          </span>
          <span className="score-label">Answered</span>
        </div>
      </section>

      {questions.map((q, qi) => {
        const selected = answers[qi];
        const locked = selected != null;
        return (
          <section className="card question" key={qi}>
            <h3 className="q-stem">
              <span className="q-num">Q{qi + 1}.</span> {q.question}
            </h3>
            <div className="options">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const isCorrect = q.answerIndex === oi;
                let cls = 'option';
                if (locked) {
                  if (isCorrect) cls += ' correct';
                  else if (isSelected) cls += ' wrong';
                }
                return (
                  <button
                    type="button"
                    className={cls}
                    key={oi}
                    onClick={() => choose(qi, oi)}
                    disabled={locked}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="option-text">{opt}</span>
                    {locked && isCorrect && <span className="mark ok">&#10003;</span>}
                    {locked && isSelected && !isCorrect && (
                      <span className="mark bad">&#10007;</span>
                    )}
                  </button>
                );
              })}
            </div>
            {locked && (
              <p className={`feedback ${selected === q.answerIndex ? 'ok' : 'bad'}`}>
                {selected === q.answerIndex ? 'Correct! ' : 'Incorrect. '}
                {q.explanation}
              </p>
            )}
          </section>
        );
      })}

      <div className="test-actions">
        {allAnswered && (
          <div className="score">
            Final: <strong>{correct}</strong> / {total}
          </div>
        )}
        {attempted > 0 && (
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
