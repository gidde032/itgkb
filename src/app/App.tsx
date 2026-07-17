import { useCallback, useMemo, useState } from 'react';
import { loadContent } from '../content/load';
import { CuratedForceLayout } from '../layout/curatedForce';
import { GalaxyCanvas } from '../galaxy/GalaxyCanvas';
import { ArticlePanel } from '../article/ArticlePanel';

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
  const onSelect = useCallback((id: string | null) => setSelectedId(id), []);

  const selected = selectedId ? (articlesById.get(selectedId) ?? null) : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__title">IT Knowledge Galaxy</span>
        <span className="app-header__sub">Carlson IT Service Center</span>
      </header>
      <GalaxyCanvas
        articles={content.articles}
        constellations={content.constellations}
        positions={positions}
        selectedId={selectedId}
        onSelect={onSelect}
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
          onNavigate={(id) => setSelectedId(id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
