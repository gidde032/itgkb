import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import 'd3-transition'; // side-effect: patches selection.transition for smooth reset (FR-9)
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import { computeConstellationLinks, computeRelatedLinks } from './links';
import { displayPositions } from './display';
import { motionDuration, prefersReducedMotion } from '../app/motion';
import { ResetIcon, RelatedLinesIcon } from '../ui/icons';
import { drawGalaxy, hitTest, screenHitRadius, makeDust, type StarMeta } from './draw';

export interface GalaxyCanvasProps {
  articles: Article[];
  constellations: Constellation[];
  positions: StarPosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** FR-8: when a search is active, non-matching stars dim in place. Null = no search. */
  matchIds: ReadonlySet<string> | null;
  /** FR-7: bumping seq flies the view to the star with this id. */
  focus: { id: string; seq: number } | null;
}

export function GalaxyCanvas({
  articles,
  constellations,
  positions,
  selectedId,
  onSelect,
  matchIds,
  focus,
}: GalaxyCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const restTransformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const hoveredRef = useRef<string | null>(null);
  // P3-F1: selection + search state are draw-time inputs, not setup inputs.
  // Keeping them in refs lets keystrokes re-render without tearing down zoom,
  // listeners, and the ResizeObserver on every change.
  const drawStateRef = useRef<{
    selectedId: string | null;
    matchIds: ReadonlySet<string> | null;
    showRelatedOverlay: boolean;
  }>({
    selectedId,
    matchIds,
    showRelatedOverlay: false,
  });
  const renderRef = useRef<(() => void) | null>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  // P14: cache prefers-reduced-motion once and keep it current via a single
  // listener, instead of re-querying matchMedia on every animation frame.
  const reducedMotionRef = useRef(prefersReducedMotion());
  // P1: twinkle phase advances only while the loop is active, so it resumes
  // seamlessly after an idle pause (no phase jump from wall-clock time).
  const twinkleTimeRef = useRef(0);

  // #39: related-lines overlay toggle state.
  const [showRelatedOverlay, setShowRelatedOverlay] = useState(false);
  const toggleRelatedOverlay = useCallback(() => setShowRelatedOverlay((v) => !v), []);

  const colorByConstellation = useMemo(
    () => new Map(constellations.map((c) => [c.id, c.color])),
    [constellations],
  );

  const meta = useMemo(() => {
    const prefixByConstellation = new Map(constellations.map((c) => [c.id, c.prefix]));
    // Catalog ids number per constellation: GW-001, SEC-001, ...
    const counters = new Map<string, number>();
    return new Map<string, StarMeta>(
      articles.map((a) => {
        const n = (counters.get(a.constellation) ?? 0) + 1;
        counters.set(a.constellation, n);
        const prefix = prefixByConstellation.get(a.constellation) ?? 'ITG';
        return [
          a.id,
          {
            color: colorByConstellation.get(a.constellation) ?? '#ffffff',
            stub: a.stub,
            title: a.title,
            summary: a.summary,
            catalog: `${prefix}-${String(n).padStart(3, '0')}`,
          },
        ];
      }),
    );
  }, [articles, constellations, colorByConstellation]);

  // #39: compute constellation links with positions for orphan rescue.
  const links = useMemo(() => {
    const posMap = new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }]));
    return computeConstellationLinks(articles, posMap);
  }, [articles, positions]);

  // #39: compute related-article links from frontmatter.
  const relatedLinks = useMemo(
    () => computeRelatedLinks(articles, colorByConstellation),
    [articles, colorByConstellation],
  );

  const dust = useMemo(() => makeDust(140), []);

  // P14: keep the cached reduced-motion flag current. One listener fires only on
  // an actual preference change — never per frame.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = mql.matches;
    };
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // P6-B1: parallax is driven by the PAN DELTA from rest, not the absolute
    // transform — the initial centering translation is not user pan.
    const currentPoints = () => {
      const t = transformRef.current;
      const r = restTransformRef.current;
      return displayPositions(positions, t.x - r.x, t.y - r.y, t.k);
    };
    // P2-F2: dust shares the parallax transform so the depth cue is real.
    const currentDust = () => {
      const t = transformRef.current;
      const r = restTransformRef.current;
      return displayPositions(dust, t.x - r.x, t.y - r.y, t.k);
    };

    const render = () => {
      const reducedMotion = reducedMotionRef.current;
      ctx.save();
      ctx.scale(dpr, dpr);
      drawGalaxy(
        ctx,
        width,
        height,
        {
          points: currentPoints(),
          meta,
          links,
          relatedLinks,
          dust: currentDust(),
        },
        constellations,
        transformRef.current,
        drawStateRef.current.selectedId,
        hoveredRef.current,
        drawStateRef.current.matchIds,
        reducedMotion ? 0 : twinkleTimeRef.current,
        reducedMotion ? 0 : 0.3,
        drawStateRef.current.showRelatedOverlay,
      );
      ctx.restore();

      // Coordinate HUD tracks the view centre (pseudo RA/DEC — instrument flavour).
      if (hudRef.current) {
        const [wx, wy] = transformRef.current.invert([width / 2, height / 2]);
        const ra = (((wx / 60) % 24) + 24) % 24;
        const hh = Math.floor(ra);
        const mm = Math.floor((ra - hh) * 60);
        const dec = Math.max(-89, Math.min(89, Math.round(-wy / 18)));
        hudRef.current.textContent =
          `RA ${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m · ` +
          `DEC ${dec >= 0 ? '+' : '−'}${Math.abs(dec)}°`;
      }
    };

    // #19: living-sky twinkle — a capped (~30fps) redraw loop, only when motion is
    // allowed AND the user is actively interacting. The loop self-cancels after a
    // short idle window so a still galaxy burns no CPU/GPU (audit P1: previously
    // repainted forever even while a user read an article); any pan/zoom/hover/
    // click wakes it instantly. requestAnimationFrame auto-throttles in background tabs.
    const IDLE_MS = 2500;
    let rafId = 0;
    let lastFrame = 0;
    let lastInteraction = performance.now();
    function wake() {
      lastInteraction = performance.now();
      if (rafId === 0 && !reducedMotionRef.current) {
        lastFrame = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }
    function tick(now: number) {
      if (reducedMotionRef.current || now - lastInteraction > IDLE_MS) {
        rafId = 0; // idle (or reduced motion granted mid-session): stop rescheduling
        return;
      }
      // Cap dt so a backgrounded tab doesn't fast-forward the twinkle phase.
      twinkleTimeRef.current += Math.min(64, now - lastFrame);
      lastFrame = now;
      render();
      rafId = requestAnimationFrame(tick);
    }

    const resize = () => {
      wake();
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      render();
    };

    // P2-F1: any view change invalidates the hover tooltip's screen anchor,
    // so hover clears through one shared path (also used by mouseleave).
    const clearHover = () => {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        canvas.style.cursor = 'grab';
        setHovered(null);
      }
    };

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        clearHover();
        wake();
        render();
      });
    zoomRef.current = zoomBehavior;
    const selection = select(canvas);
    selection.call(zoomBehavior);
    if (transformRef.current === zoomIdentity) {
      const rect = canvas.getBoundingClientRect();
      const initial = zoomIdentity.translate(rect.width / 2, rect.height / 2).scale(0.8);
      restTransformRef.current = initial;
      selection.call(zoomBehavior.transform, initial);
    }

    const toWorld = (event: MouseEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      return transformRef.current.invert([event.clientX - rect.left, event.clientY - rect.top]);
    };

    const onClick = (event: MouseEvent) => {
      wake();
      const [wx, wy] = toWorld(event);
      onSelect(hitTest(currentPoints(), wx, wy, screenHitRadius(transformRef.current.k)));
    };

    const onMove = (event: MouseEvent) => {
      wake();
      const [wx, wy] = toWorld(event);
      const points = currentPoints();
      const id = hitTest(points, wx, wy, screenHitRadius(transformRef.current.k));
      if (id !== hoveredRef.current) {
        hoveredRef.current = id;
        canvas.style.cursor = id ? 'pointer' : 'grab';
        if (id) {
          const p = points.find((q) => q.id === id);
          const t = transformRef.current;
          setHovered(p ? { id, x: p.x * t.k + t.x, y: p.y * t.k + t.y } : null);
        } else {
          setHovered(null);
        }
        render();
      }
    };
    const onLeave = () => {
      clearHover();
      render();
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    renderRef.current = render;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Canvas text uses self-hosted fonts; redraw once they're ready so labels
    // and catalog IDs aren't first painted in the fallback face.
    if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
      void document.fonts.ready.then(() => renderRef.current?.());
    }

    // #19: living-sky twinkle starts on mount (motion allowed) and after any
    // interaction via wake(); it self-cancels once idle (see tick above).
    if (!reducedMotionRef.current) wake();

    return () => {
      renderRef.current = null;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      observer.disconnect();
      selection.on('.zoom', null);
    };
  }, [positions, meta, links, relatedLinks, dust, constellations, onSelect]);

  // P3-F1: cheap re-draw when selection/search/overlay change — no setup teardown.
  useEffect(() => {
    drawStateRef.current = { selectedId, matchIds, showRelatedOverlay };
    renderRef.current?.();
  }, [selectedId, matchIds, showRelatedOverlay]);

  // #39: keyboard shortcut — R toggles related-lines overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea or when modifier keys are held.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowRelatedOverlay((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // FR-7: fly to a star when a focus request arrives (related-link nav, search Enter).
  useEffect(() => {
    if (!focus) return;
    const canvas = canvasRef.current;
    const zoomBehavior = zoomRef.current;
    const target = positions.find((p) => p.id === focus.id);
    if (!canvas || !zoomBehavior || !target) return;
    const rect = canvas.getBoundingClientRect();
    const k = Math.max(1.2, transformRef.current.k);
    select(canvas)
      .transition()
      .duration(motionDuration(500))
      .call(
        zoomBehavior.transform,
        zoomIdentity
          .translate(rect.width / 2, rect.height / 2)
          .scale(k)
          .translate(-target.x, -target.y),
      );
  }, [focus, positions]);

  const resetView = () => {
    const canvas = canvasRef.current;
    const zoomBehavior = zoomRef.current;
    if (!canvas || !zoomBehavior) return;
    const rect = canvas.getBoundingClientRect();
    const rest = zoomIdentity.translate(rect.width / 2, rect.height / 2).scale(0.8);
    restTransformRef.current = rest;
    select(canvas).transition().duration(motionDuration(450)).call(zoomBehavior.transform, rest);
  };

  const hoveredMeta = hovered ? meta.get(hovered.id) : undefined;

  return (
    <div className="galaxy-wrap">
      <canvas
        ref={canvasRef}
        className="galaxy-canvas"
        role="img"
        aria-label="Interactive galaxy map of IT knowledge articles"
      />
      {hovered && hoveredMeta && hovered.id !== selectedId && (
        <div
          className="star-tooltip"
          style={{ left: hovered.x, top: hovered.y }}
          role="tooltip"
          aria-hidden="true"
        >
          <strong>{hoveredMeta.title}</strong>
          <span>{hoveredMeta.summary}</span>
        </div>
      )}
      <div className="hud" aria-hidden="true">
        <span ref={hudRef}>RA 00h 00m · DEC +00°</span> · <b>{articles.length} OBJECTS</b> ·{' '}
        {constellations.length} FIELDS
      </div>
      <button
        type="button"
        className="related-toggle"
        aria-pressed={showRelatedOverlay}
        onClick={toggleRelatedOverlay}
        title="Toggle related-article lines (R)"
      >
        <RelatedLinesIcon />
        Related lines
      </button>
      <button type="button" className="reset-view" onClick={resetView}>
        <ResetIcon />
        Reset view
      </button>
    </div>
  );
}
