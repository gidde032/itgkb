import ReactMarkdown from 'react-markdown';
import type { Article, Constellation } from '../content/types';

export interface ArticlePanelProps {
  article: Article;
  constellation: Constellation | undefined;
  articlesById: Map<string, Article>;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export function ArticlePanel({
  article,
  constellation,
  articlesById,
  onNavigate,
  onClose,
}: ArticlePanelProps): JSX.Element {
  return (
    <aside className="article-panel" aria-label={`Article: ${article.title}`}>
      <header className="article-panel__header">
        <div className="article-panel__eyebrow" style={{ color: constellation?.color }}>
          {constellation?.name ?? article.constellation}
        </div>
        <h1>{article.title}</h1>
        {article.stub && (
          <p className="article-panel__stub-badge">Stub — procedure to be filled in</p>
        )}
        <p className="article-panel__summary">{article.summary}</p>
        <ul className="article-panel__tags">
          {article.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <button type="button" className="article-panel__close" onClick={onClose} aria-label="Close article">
          ✕
        </button>
      </header>
      <div className="article-panel__body">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>
      {article.related.length > 0 && (
        <footer className="article-panel__related">
          <h2>Related articles</h2>
          <ul>
            {article.related.map((rid) => {
              const target = articlesById.get(rid);
              if (!target) return null;
              return (
                <li key={rid}>
                  <button type="button" onClick={() => onNavigate(rid)}>
                    {target.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </footer>
      )}
    </aside>
  );
}
