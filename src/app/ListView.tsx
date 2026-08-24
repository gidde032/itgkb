import { useMemo } from 'react';
import type { Article, Constellation } from '../content/types';
import type { MatchResult } from '../search/types';

export interface ListViewProps {
  articles: Article[];
  constellations: Constellation[];
  matchIds: ReadonlySet<string> | null;
  matches: MatchResult[] | null;
  onOpen: (id: string) => void;
}

/**
 * NF-7 narrow-viewport fallback: the same knowledge base as a grouped,
 * keyboard-navigable list. When a search is active, flattens into a single
 * ranked list so the semantic re-ranking is visible; restores constellation
 * grouping when the query clears.
 */
export function ListView({
  articles,
  constellations,
  matchIds,
  matches,
  onOpen,
}: ListViewProps): JSX.Element {
  const articlesById = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const constellationsById = useMemo(
    () => new Map(constellations.map((c) => [c.id, c])),
    [constellations],
  );

  if (matches && matches.length > 0) {
    return (
      <nav className="list-view" aria-label="Search results">
        <ul className="list-view__flat">
          {matches.map((m) => {
            const a = articlesById.get(m.id);
            if (!a) return null;
            const c = constellationsById.get(a.constellation);
            return (
              <li key={a.id}>
                <button type="button" onClick={() => onOpen(a.id)}>
                  <span className="list-view__title">{a.title}</span>
                  {c && (
                    <span className="list-view__tag" style={{ color: c.color }}>
                      {c.name}
                    </span>
                  )}
                  {a.stub && <span className="list-view__stub">stub</span>}
                  <span className="list-view__summary">{a.summary}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  if (matches !== null && matches.length === 0) {
    return (
      <div className="list-view list-view--empty">
        <p>No articles match this search.</p>
      </div>
    );
  }

  const groups = constellations
    .map((c) => ({
      constellation: c,
      items: articles
        .filter((a) => a.constellation === c.id)
        .filter((a) => matchIds === null || matchIds.has(a.id))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="list-view list-view--empty">
        <p>No articles match this search.</p>
      </div>
    );
  }

  return (
    <nav className="list-view" aria-label="Articles by constellation">
      {groups.map(({ constellation, items }) => (
        <section key={constellation.id} className="list-view__group">
          <h2 style={{ color: constellation.color }}>{constellation.name}</h2>
          <ul>
            {items.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onOpen(a.id)}>
                  <span className="list-view__title">{a.title}</span>
                  {a.stub && <span className="list-view__stub">stub</span>}
                  <span className="list-view__summary">{a.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
