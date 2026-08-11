import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import 'd3-transition'; // side-effect: patches selection.transition for smooth reset (FR-9)
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import { computeConstellationLinks, type StarLink } from './links';
import { displayPositions, type DisplayPoint } from './display';
import { hashString } from '../layout/curatedForce';
import { motionDuration } from '../app/motion';
import { ResetIcon } from '../ui/icons';

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

interface StarMeta {
  color: string;
  stub: boolean;
  title: string;
  summary: string;
  /** Star-catalog id (e.g. ITG-014) — the instrument-layer signature. */
  catalog?: string;
}

const HIT_RADIUS = 18;

/**
 * F1 regression: the click target should feel the same size on screen at any
 * zoom, so the world-space radius scales with 1/k — clamped so extreme zoom
 * levels can't make stars unclickable or grab distant neighbors.
 */
export function screenHitRadius(k: number): number {
  return Math.min(40, Math.max(6, HIT_RADIUS / k));
}

/** World-space nearest-star hit test; exported for regression tests. */
export function hitTest(
  stars: readonly { id: string; x: number; y: number }[],
  worldX: number,
  worldY: number,
  radius: number = HIT_RADIUS,
): string | null {
  let best: string | null = null;
  let bestDist = radius;
  for (const s of stars) {
    const d = Math.hypot(s.x - worldX, s.y - worldY);
    if (d < bestDist) {
      bestDist = d;
      best = s.id;
    }
  }
  return best;
}

/** Two-digit hex alpha suffix for `#rrggbb` colours (0..1 -> "00".."ff"). */
function alphaHex(a: number): string {
  return Math.max(0, Math.min(255, Math.round(a * 255)))
    .toString(16)
    .padStart(2, '0');
}

/** Trim `text` to fit `maxWidth` in the current ctx font, appending an ellipsis. */
function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t.trimEnd()}…`;
}

/** Deterministic background dust, generated once per mount from a fixed seed. */
function makeDust(count: number): DisplayPoint[] {
  const dust: DisplayPoint[] = [];
  for (let i = 0; i < count; i++) {
    const h1 = hashString(`dust-x-${i}`);
    const h2 = hashString(`dust-y-${i}`);
    const h3 = hashString(`dust-z-${i}`);
    dust.push({
      id: `dust-${i}`,
      x: ((h1 % 2000) - 1000) * 1.1,
      y: ((h2 % 1400) - 700) * 1.1,
      z: (h3 % 1000) / 1000,
    });
  }
  return dust;
}

interface Scene {
  points: DisplayPoint[];
  meta: Map<string, StarMeta>;
  links: StarLink[];
  dust: DisplayPoint[];
}

/** Pure draw routine, kept outside React for render-on-demand. */
export function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  constellations: Constellation[],
  transform: ZoomTransform,
  selectedId: string | null,
  hoveredId: string | null,
  matchIds: ReadonlySet<string> | null,
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  bg.addColorStop(0, '#0b1120');
  bg.addColorStop(1, '#070b14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // Background dust (deep parallax layer).
  for (const d of scene.dust) {
    ctx.globalAlpha = 0.1 + d.z * 0.18;
    ctx.fillStyle = '#aebcd8';
    ctx.beginPath();
    ctx.arc(d.x, d.y, 0.6 + d.z * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Constellation region halos + labels.
  for (const c of constellations) {
    const halo = ctx.createRadialGradient(c.anchor.x, c.anchor.y, 0, c.anchor.x, c.anchor.y, 190);
    halo.addColorStop(0, `${c.color}14`);
    halo.addColorStop(1, `${c.color}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(c.anchor.x, c.anchor.y, 190, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = "600 13px 'Archivo Narrow', system-ui, sans-serif";
    ctx.fillStyle = `${c.color}66`;
    ctx.fillText(c.name.toUpperCase().split('').join('\u200a\u200a'), c.anchor.x, c.anchor.y - 120);
  }

  const pointById = new Map(scene.points.map((p) => [p.id, p]));

  // Constellation line art beneath the stars.
  ctx.lineWidth = 1 / transform.k;
  for (const link of scene.links) {
    const a = pointById.get(link.a);
    const b = pointById.get(link.b);
    if (!a || !b) continue;
    const color = scene.meta.get(link.a)?.color ?? '#ffffff';
    const linkDimmed = matchIds !== null && (!matchIds.has(link.a) || !matchIds.has(link.b));
    ctx.strokeStyle = linkDimmed ? `${color}10` : `${color}2e`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (const p of scene.points) {
    const m = scene.meta.get(p.id);
    if (!m) continue;
    const depth = 0.65 + p.z * 0.35;
    const dimmed = matchIds !== null && !matchIds.has(p.id);
    const emphasized = !dimmed && (p.id === selectedId || p.id === hoveredId);
    const r = (emphasized ? 9 : 6) * depth;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
    glow.addColorStop(0, m.color);
    glow.addColorStop(0.35, `${m.color}66`);
    glow.addColorStop(1, `${m.color}00`);
    ctx.globalAlpha = (m.stub ? 0.45 : depth) * (dimmed ? 0.15 : 1);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = m.stub ? `${m.color}99` : '#fbf6ee';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (m.stub) {
      ctx.strokeStyle = `${m.color}aa`;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (p.id === selectedId) {
      ctx.strokeStyle = '#f2a0a6cc';
      ctx.lineWidth = 1.5 / transform.k;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Merged star label (body font): a bracketed, category-coloured catalog id
    // once labels are on, with the title revealed on hover/selection or a deeper
    // zoom — dimmed and truncated so it never sprawls at scale.
    if (m.catalog && !dimmed && transform.k > 0.75) {
      const showTitle = emphasized || transform.k > 1.6;
      const alpha = Math.min(1, (transform.k - 0.6) * 2);
      ctx.textAlign = 'left';
      const ly = p.y + 3;
      let lx = p.x + r + 6;

      ctx.font = "600 10px 'Hanken Grotesk', system-ui, sans-serif";
      const idStr = `[${m.catalog}]`;
      ctx.fillStyle = `${m.color}${alphaHex(alpha)}`;
      ctx.fillText(idStr, lx, ly);

      if (showTitle) {
        lx += ctx.measureText(idStr).width + 5;
        ctx.font = "500 10px 'Hanken Grotesk', system-ui, sans-serif";
        ctx.fillStyle = `#5c6884${alphaHex(alpha)}`;
        ctx.fillText('·', lx, ly);
        lx += ctx.measureText('·').width + 5;
        ctx.fillStyle = `#8593b0${alphaHex(alpha)}`;
        ctx.fillText(truncateToWidth(ctx, m.title, 168), lx, ly);
      }
      ctx.textAlign = 'center';
    }
  }
  ctx.restore();
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
  const drawStateRef = useRef<{ selectedId: string | null; matchIds: ReadonlySet<string> | null }>({
    selectedId,
    matchIds,
  });
  const renderRef = useRef<(() => void) | null>(null);
  const hudRef = useRef<HTMLSpanElement>(null);

  const meta = useMemo(() => {
    const colorByConstellation = new Map(constellations.map((c) => [c.id, c.color]));
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
  }, [articles, constellations]);

  const links = useMemo(() => computeConstellationLinks(articles), [articles]);
  const dust = useMemo(() => makeDust(140), []);

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
      ctx.save();
      ctx.scale(dpr, dpr);
      drawGalaxy(
        ctx,
        width,
        height,
        { points: currentPoints(), meta, links, dust: currentDust() },
        constellations,
        transformRef.current,
        drawStateRef.current.selectedId,
        hoveredRef.current,
        drawStateRef.current.matchIds,
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

    const resize = () => {
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
      const [wx, wy] = toWorld(event);
      onSelect(hitTest(currentPoints(), wx, wy, screenHitRadius(transformRef.current.k)));
    };

    const onMove = (event: MouseEvent) => {
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

    return () => {
      renderRef.current = null;
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      observer.disconnect();
      selection.on('.zoom', null);
    };
  }, [positions, meta, links, dust, constellations, onSelect]);

  // P3-F1: cheap re-draw when selection/search change — no setup teardown.
  useEffect(() => {
    drawStateRef.current = { selectedId, matchIds };
    renderRef.current?.();
  }, [selectedId, matchIds]);

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
        zoomIdentity.translate(rect.width / 2, rect.height / 2).scale(k).translate(-target.x, -target.y),
      );
  }, [focus, positions]);

  const resetView = () => {
    const canvas = canvasRef.current;
    const zoomBehavior = zoomRef.current;
    if (!canvas || !zoomBehavior) return;
    const rect = canvas.getBoundingClientRect();
    const rest = zoomIdentity.translate(rect.width / 2, rect.height / 2).scale(0.8);
    restTransformRef.current = rest;
    select(canvas)
      .transition()
      .duration(motionDuration(450))
      .call(zoomBehavior.transform, rest);
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
          role="status"
        >
          <strong>{hoveredMeta.title}</strong>
          <span>{hoveredMeta.summary}</span>
        </div>
      )}
      <div className="hud" aria-hidden="true">
        <span ref={hudRef}>RA 00h 00m · DEC +00°</span> · <b>{articles.length} OBJECTS</b> ·{' '}
        {constellations.length} FIELDS
      </div>
      <button type="button" className="reset-view" onClick={resetView}>
        <ResetIcon />
        Reset view
      </button>
    </div>
  );
}
