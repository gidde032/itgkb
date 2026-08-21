import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { loadContent } from '../content/load';
import { CuratedForceLayout } from '../layout/curatedForce';
import { TextSearch } from '../search/textSearch';
import { GalaxyCanvas } from '../galaxy/GalaxyCanvas';
// P6: the article panel pulls in the react-markdown pipeline (~46% of the JS
// bundle). Lazy-load it so users who never open an article don't pay that cost —
// the panel chunk loads on first open and is cached after.
const ArticlePanel = lazy(() =>
  import('../article/ArticlePanel').then((m) => ({ default: m.ArticlePanel })),
);
// #31: the 3D showcase renderer pulls in three.js (~220 KB gz). Same lazy
// pattern — the chunk loads on the first 3D toggle and is cached after; the
// cold-load budget (NF-4) measures initial payload only (decision 6).
const ShowcaseCanvas = lazy(() =>
  import('../showcase/ShowcaseCanvas').then((m) => ({ default: m.ShowcaseCanvas })),
);
import { SearchBar } from './SearchBar';
import { ListView } from './ListView';
import { useNarrowViewport } from './useNarrowViewport';
import { hasWebGL } from './webgl';
import { ListIcon, StarIcon, CubeIcon } from '../ui/icons';

const searchProvider = new TextSearch();

/** View modes (#31 decision 11): the segmented control picks one explicitly. */
type ViewMode = 'galaxy' | 'list' | 'showcase';

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
  const narrow = useNarrowViewport();
  // A4: desktop users can pick the list; narrow viewports force it (NF-7).
  const [mode, setMode] = useState<ViewMode>('galaxy');
  // #31 decision 7: 3D is desktop-only and requires WebGL; without it the
  // segment renders disabled with a note.
  const webglAvailable = useMemo(() => hasWebGL(), []);
  const showList = narrow || mode === 'list';
  const showShowcase = !showList && mode === 'showcase';

  const matches = useMemo(
    () => (query.trim() ? searchProvider.search(query, content.articles) : null),
    [query, content.articles],
  );
  const matchIds = useMemo(() => (matches ? new Set(matches.map((m) => m.id)) : null), [matches]);

  // A11y: remember what opened the panel so we can return focus on close.
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const onSelect = useCallback((id: string | null) => {
    if (id) lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setSelectedId(id);
  }, []);
  const flyTo = useCallback((id: string) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setSelectedId(id);
    setFocus((f) => ({ id, seq: (f?.seq ?? 0) + 1 }));
  }, []);
  const closePanel = useCallback(() => {
    setSelectedId(null);
    const el = lastFocusedRef.current;
    lastFocusedRef.current = null;
    // Restore focus to the trigger, unless it lived inside the (now closing) panel.
    if (el && document.contains(el) && !el.closest('.article-panel')) el.focus();
  }, []);
  const openTopMatch = useCallback(() => {
    if (matches && matches.length > 0) flyTo(matches[0].id);
  }, [matches, flyTo]);
  const clearSearch = useCallback(() => setQuery(''), []);

  const selected = selectedId ? (articlesById.get(selectedId) ?? null) : null;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#article-search">
        Skip to search
      </a>
      <header className="app-header">
        <div className="wordmark">
          <h1 className="wordmark__title visually-hidden">IT Knowledge Galaxy</h1>
          <span className="wordmark__mark">
            <i>it</i>gkb
          </span>
          <span className="wordmark__sub">IT Galactic Knowledge Base</span>
        </div>
      </header>
      <main className="app-main">
        <SearchBar
          query={query}
          matchCount={matches ? matches.length : null}
          partial={Boolean(matches && matches.length > 0 && matches[0].partial)}
          onChange={setQuery}
          onOpenTopMatch={openTopMatch}
          onClear={clearSearch}
        />
        {!narrow && (
          <div className="mode-switch" role="group" aria-label="View mode">
            <button
              type="button"
              className="mode-switch__seg"
              aria-pressed={mode === 'list'}
              onClick={() => setMode('list')}
            >
              <ListIcon />
              List
            </button>
            <button
              type="button"
              className="mode-switch__seg"
              aria-pressed={mode === 'galaxy'}
              onClick={() => setMode('galaxy')}
            >
              <StarIcon />
              Galaxy
            </button>
            <button
              type="button"
              className="mode-switch__seg"
              aria-pressed={mode === 'showcase'}
              disabled={!webglAvailable}
              title={webglAvailable ? '3D view' : '3D view requires WebGL'}
              onClick={() => setMode('showcase')}
            >
              <CubeIcon />
              3D
            </button>
          </div>
        )}
        {showList ? (
          <ListView
            articles={content.articles}
            constellations={content.constellations}
            matchIds={matchIds}
            onOpen={flyTo}
          />
        ) : showShowcase ? (
          <Suspense
            fallback={
              <div className="galaxy-wrap" aria-label="Loading 3D view">
                <span className="showcase-loading">Loading 3D view…</span>
              </div>
            }
          >
            <ShowcaseCanvas
              articles={content.articles}
              constellations={content.constellations}
              positions={positions}
              selectedId={selectedId}
              onSelect={onSelect}
              matchIds={matchIds}
              focus={focus}
            />
          </Suspense>
        ) : (
          <GalaxyCanvas
            articles={content.articles}
            constellations={content.constellations}
            positions={positions}
            selectedId={selectedId}
            onSelect={onSelect}
            matchIds={matchIds}
            focus={focus}
          />
        )}
      </main>
      {content.errors.length > 0 && (
        <div className="content-errors" role="alert">
          {content.errors.length} content problem{content.errors.length === 1 ? '' : 's'} — see
          console for details.
        </div>
      )}
      {selected && (
        <Suspense
          fallback={
            <aside className="article-panel article-panel--loading" aria-label="Loading article">
              <span className="article-panel__loading">Loading…</span>
            </aside>
          }
        >
          <ArticlePanel
            article={selected}
            constellation={content.constellations.find((c) => c.id === selected.constellation)}
            articlesById={articlesById}
            onNavigate={flyTo}
            onClose={closePanel}
          />
        </Suspense>
      )}
    </div>
  );
}
