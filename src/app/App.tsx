import { useCallback, useMemo, useState } from 'react';
import { loadContent } from '../content/load';
import { CuratedForceLayout } from '../layout/curatedForce';
import { TextSearch } from '../search/textSearch';
import { GalaxyCanvas } from '../galaxy/GalaxyCanvas';
import { ArticlePanel } from '../article/ArticlePanel';
import { SearchBar } from './SearchBar';

const searchProvider = new TextSearch();

export function App(): JSX.Element {
  const content = useMemo(() => loadContent(), []);
  const positions = useMemo(
    () => new CuratedForceLayout().layout(content.articles, content.constellations),
    [content],
  );
  const articlesById = useMemo(
    () => new Map(content.articles.map((a) => [a.id, a])),
    [content.articles],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<{ id: string; seq: number } | null>(null);

  const matches = useMemo(
    () => (query.trim() ? searchProvider.search(query, content.articles) : null),
    [query, content.articles],
  );
  const matchIds = useMemo(() => (matches ? new Set(matches.map((m) => m.id)) : null), [matches]);

  const onSelect = useCallback((id: string | null) => setSelectedId(id), []);
  const flyTo = useCallback((id: string) => {
    setSelectedId(id);
    setFocus((f) => ({ id, seq: (f?.seq ?? 0) + 1 }));
  }, []);
  const openTopMatch = useCallback(() => {
    if (matches && matches.length > 0) flyTo(matches[0].id);
  }, [matches, flyTo]);
  const clearSearch = useCallback(() => setQuery(''), []);

  const selected = selectedId ? (articlesById.get(selectedId) ?? null) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__title">IT Knowledge Galaxy</span>
        <span className="app-header__sub">Carlson IT Service Center</span>
      </header>
      <SearchBar
        query={query}
        matchCount={matches ? matches.length : null}
        onChange={setQuery}
        onOpenTopMatch={openTopMatch}
        onClear={clearSearch}
      />
      <GalaxyCanvas
        articles={content.articles}
        constellations={content.constellations}
        positions={positions}
        selectedId={selectedId}
        onSelect={onSelect}
        matchIds={matchIds}
        focus={focus}
      />
      {content.errors.length > 0 && (
        <div className="content-errors" role="alert">
          {content.errors.length} content problem{content.errors.length === 1 ? '' : 's'} — see
          console for details.
        </div>
      )}
      {selected && (
        <ArticlePanel
          article={selected}
          constellation={content.constellations.find((c) => c.id === selected.constellation)}
          articlesById={articlesById}
          onNavigate={flyTo}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
