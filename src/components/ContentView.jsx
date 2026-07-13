import { categoryLabel, categoryShort } from '../prompts.js';

function Chips({ items }) {
  const list = (items || []).filter((x) => x && String(x).trim());
  if (list.length === 0) return <span className="muted">-</span>;
  return (
    <div className="chips">
      {list.map((item, i) => (
        <span className="chip" key={i}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ContentView({ data }) {
  if (!data) return null;

  return (
    <div className="content">
      <div className="content-header">
        <h2 className="word-title">
          <span className="cat-name">{categoryShort(data.category)}</span>
          <span className="sep"> : </span>
          <span className="the-word">{data.word}</span>
        </h2>
      </div>

      {data.meaning && (
        <section className="card">
          <h3>Meaning</h3>
          <p>{data.meaning}</p>
        </section>
      )}

      {data.categoryNote && (
        <section className="card">
          <h3>{categoryLabel(data.category)} note</h3>
          <p>{data.categoryNote}</p>
        </section>
      )}

      <div className="card-grid">
        <section className="card">
          <h3>Synonyms</h3>
          <Chips items={data.synonyms} />
        </section>
        <section className="card">
          <h3>Antonyms</h3>
          <Chips items={data.antonyms} />
        </section>
      </div>

      {data.relatedWords && data.relatedWords.length > 0 && (
        <section className="card">
          <h3>Related</h3>
          <Chips items={data.relatedWords} />
        </section>
      )}

      {data.examples && data.examples.length > 0 && (
        <section className="card">
          <h3>Examples</h3>
          <ul className="examples">
            {data.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </section>
      )}

      {data.tip && (
        <section className="card tip">
          <h3>Exam tip</h3>
          <p>{data.tip}</p>
        </section>
      )}
    </div>
  );
}
