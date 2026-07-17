import type { Article, Constellation } from '../content/types';

export interface ListViewProps {
  articles: Article[];
  constellations: Constellation[];
  /** Active search matches; null = no search, show everything. */
  matchIds: ReadonlySet<string> | null;
  onOpen: (id: string) => void;
}

/**
 * NF-7 narrow-viewport fallback: the same knowledge base as a grouped,
 * keyboard-navigable list. Search filters it exactly as it dims the galaxy.
 */
export function ListView({ articles, constellations, matchIds, onOpen }: ListViewProps): JSX.Element {
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
