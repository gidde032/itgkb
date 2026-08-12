import { useEffect, useRef, type KeyboardEvent } from 'react';
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
  const panelRef = useRef<HTMLElement>(null);
  // A11y: move focus into the panel when it opens or navigates to a new article,
  // so keyboard/screen-reader users land on the content they just requested.
  useEffect(() => {
    panelRef.current?.focus();
  }, [article.id]);
  // A11y: trap Tab within the modal panel so focus can't escape to the controls
  // (search/canvas) hidden behind the overlay. Escape still closes.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="article-panel"
      role="dialog"
      aria-modal="true"
      aria-label={`Article: ${article.title}`}
    >
      <header className="article-panel__header">
        <div className="article-panel__eyebrow">{constellation?.name ?? article.constellation}</div>
        <h2>{article.title}</h2>
        {article.stub && (
          <p className="article-panel__stub-badge">Stub — procedure to be filled in</p>
        )}
        <p className="article-panel__summary">{article.summary}</p>
        <ul className="article-panel__tags">
          {article.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <button
          type="button"
          className="article-panel__close"
          onClick={onClose}
          aria-label="Close article"
        >
          ✕
        </button>
      </header>
      <div className="article-panel__body">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>
      {article.related.length > 0 && (
        <footer className="article-panel__related">
          <h3>Related articles</h3>
          <ul>
            {article.related.map((rid) => {
              const target = articlesById.get(rid);
              if (!target) return null;
              return (
                <li key={rid}>
                  <button type="button" onClick={() => onNavigate(rid)}>
                    <span className="visually-hidden">Related: </span>
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
