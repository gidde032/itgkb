import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadContent } from '../content/load';
import {
  applySemanticConstellations,
  coversArticles,
  loadSemanticMap,
  usesKnownConstellations,
} from '../content/semanticMap';
import { CuratedForceLayout } from '../layout/curatedForce';
import { SemanticLayout } from '../layout/semanticLayout';
import {
  loadSemanticVectors,
  vectorsCoverArticles,
  vectorsMatchMap,
} from '../content/semanticVectors';
import { SemanticTextSearch } from '../search/semanticTextSearch';
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
import { SearchDropdown } from './SearchDropdown';
import { ListView } from './ListView';
import { NARROW_BREAKPOINT_PX, useNarrowViewport } from './useNarrowViewport';
import { hasWebGL } from './webgl';
import { ListIcon, StarIcon, CubeIcon } from '../ui/icons';

/** View modes (#31 decision 11): the segmented control picks one explicitly. */
type ViewMode = 'galaxy' | 'list' | 'showcase';

export function App(): JSX.Element {
  const content = useMemo(() => loadContent(), []);
  // #29 decision 5a: semantic layout is the DEFAULT; the curated force layout
  // is the fallback when the committed artifact is missing, malformed, or
  // doesn't cover every article (degenerate safety path, not a user toggle).
  const semanticMap = useMemo(() => {
    const map = loadSemanticMap();
    return map &&
      coversArticles(map, content.articles) &&
      usesKnownConstellations(map, content.constellations)
      ? map
      : null;
  }, [content]);
  const positions = useMemo(
    () =>
      (semanticMap ? new SemanticLayout(semanticMap) : new CuratedForceLayout()).layout(
        content.articles,
        content.constellations,
      ),
    [semanticMap, content],
  );
  // #30: semantic search boost — load precomputed embedding vectors and use
  // them to re-rank text search results. Same guard pattern as the map.
  const semanticVectors = useMemo(() => {
    const vecs = loadSemanticVectors();
    return vecs &&
      vectorsCoverArticles(vecs, content.articles) &&
      (!semanticMap || vectorsMatchMap(vecs, semanticMap))
      ? vecs
      : null;
  }, [content, semanticMap]);
  const searchProvider = useMemo(
    () => (semanticVectors ? new SemanticTextSearch(semanticVectors.vectors) : new TextSearch()),
    [semanticVectors],
  );
  // #29 decision 3a: when semantic mode is active, articles render under their
  // MAPPED constellation — one grouping truth across legend, list, panel,
  // colors, and both renderers. Frontmatter keeps the authored value.
  const articles = useMemo(
    () =>
      semanticMap ? applySemanticConstellations(content.articles, semanticMap) : content.articles,
    [semanticMap, content],
  );
  const articlesById = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const constellationsById = useMemo(
    () => new Map(content.constellations.map((c) => [c.id, c])),
    [content],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<{ id: string; seq: number } | null>(null);
  // One overlay preference follows the user between 2D and 3D. Selection-only
  // related links remain visible when the global overlay is off.
  const [showRelatedOverlay, setShowRelatedOverlay] = useState(false);
  const toggleRelatedOverlay = useCallback(() => setShowRelatedOverlay((visible) => !visible), []);
  // A4: desktop users can pick the list; narrow viewports force it (NF-7).
  const [mode, setMode] = useState<ViewMode>('galaxy');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [viewportAnnouncement, setViewportAnnouncement] = useState('');
  const onViewportChange = useCallback(
    (isNarrow: boolean) => {
      setViewportAnnouncement(isNarrow ? 'Viewport is narrow; showing the article list.' : '');
      // Responsive branches are removed by the next render. Move focus while
      // the active element still exists so the browser does not leave keyboard
      // users on document.body. The list is only removed on widening when the
      // remembered desktop mode is not already List.
      const removedSurfaceSelector = isNarrow
        ? '.mode-switch, .galaxy-wrap, .search-dropdown'
        : mode === 'list'
          ? null
          : '.list-view';
      if (removedSurfaceSelector && document.activeElement?.closest(removedSurfaceSelector)) {
        searchInputRef.current?.focus();
      }
    },
    [mode],
  );
  const narrow = useNarrowViewport(NARROW_BREAKPOINT_PX, onViewportChange);
  // #31 decision 7: 3D is desktop-only and requires WebGL; without it the
  // segment renders disabled with a note.
  const webglAvailable = useMemo(() => hasWebGL(), []);
  const showList = narrow || mode === 'list';
  const showShowcase = !showList && mode === 'showcase';

  const matches = useMemo(
    () => (query.trim() ? searchProvider.search(query, articles) : null),
    [query, articles, searchProvider],
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
    if (el && el !== document.body && document.contains(el) && !el.closest('.article-panel')) {
      el.focus();
    } else if (el) {
      // A responsive transition may have removed the original trigger.
      searchInputRef.current?.focus();
    }
  }, []);
  const openTopMatch = useCallback(() => {
    if (matches && matches.length > 0) flyTo(matches[0].id);
  }, [matches, flyTo]);
  const clearSearch = useCallback(() => setQuery(''), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        toggleRelatedOverlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleRelatedOverlay]);

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
          inputRef={searchInputRef}
          partial={Boolean(matches && matches.length > 0 && matches[0].partial)}
          onChange={setQuery}
          onOpenTopMatch={openTopMatch}
          onClear={clearSearch}
        />
        <span className="visually-hidden" aria-live="polite" aria-atomic="true">
          {viewportAnnouncement}
        </span>
        {!showList && matches && matches.length > 0 && (
          <SearchDropdown
            matches={matches}
            articlesById={articlesById}
            constellationsById={constellationsById}
            onSelect={flyTo}
            onClose={clearSearch}
          />
        )}
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
            {/* Review repair (a11y #2): a disabled button skips tab focus and
                title is not reliably announced — carry the exclusion reason in
                the control group itself for screen-reader and keyboard users. */}
            {!webglAvailable && (
              <span className="visually-hidden">
                The 3D view is unavailable because this browser does not support WebGL.
              </span>
            )}
          </div>
        )}
        {showList ? (
          <ListView
            articles={articles}
            constellations={content.constellations}
            matchIds={matchIds}
            matches={matches}
            onOpen={flyTo}
          />
        ) : showShowcase ? (
          <Suspense
            fallback={
              // Review repair (a11y #5): role="status" announces the chunk
              // fetch to assistive tech instead of silent content swapping.
              <div className="galaxy-wrap" role="status">
                <span className="showcase-loading">Loading 3D view…</span>
              </div>
            }
          >
            <ShowcaseCanvas
              articles={articles}
              constellations={content.constellations}
              positions={positions}
              semanticEdges={semanticMap?.edges ?? null}
              selectedId={selectedId}
              onSelect={onSelect}
              matchIds={matchIds}
              focus={focus}
              showRelatedOverlay={showRelatedOverlay}
              onToggleRelatedOverlay={toggleRelatedOverlay}
            />
          </Suspense>
        ) : (
          <GalaxyCanvas
            articles={articles}
            constellations={content.constellations}
            positions={positions}
            semanticEdges={semanticMap?.edges ?? null}
            selectedId={selectedId}
            onSelect={onSelect}
            matchIds={matchIds}
            focus={focus}
            showRelatedOverlay={showRelatedOverlay}
            onToggleRelatedOverlay={toggleRelatedOverlay}
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
