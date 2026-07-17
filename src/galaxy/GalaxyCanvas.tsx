import { useEffect, useMemo, useRef } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';

export interface GalaxyCanvasProps {
  articles: Article[];
  constellations: Constellation[];
  positions: StarPosition[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface DrawStar extends StarPosition {
  color: string;
  stub: boolean;
  title: string;
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

/** Pure draw routine, kept outside React for testability and render-on-demand. */
export function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stars: DrawStar[],
  constellations: Constellation[],
  transform: ZoomTransform,
  selectedId: string | null,
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  // Space background with a subtle center glow.
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

  // Constellation labels (sky-atlas letterspaced caps).
  ctx.textAlign = 'center';
  for (const c of constellations) {
    ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = `${c.color}55`;
    ctx.fillText(c.name.toUpperCase().split('').join('\u200a\u200a'), c.anchor.x, c.anchor.y - 90);
  }

  for (const s of stars) {
    const depth = 0.65 + s.z * 0.35; // z depth cue: brightness/size falloff
    const r = (s.id === selectedId ? 9 : 6) * depth;
    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.2);
    glow.addColorStop(0, s.color);
    glow.addColorStop(0.35, `${s.color}66`);
    glow.addColorStop(1, `${s.color}00`);
    ctx.globalAlpha = s.stub ? 0.45 : depth;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.stub ? `${s.color}99` : '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (s.stub) {
      // Dashed ring marks stub articles (FR-6).
      ctx.strokeStyle = `${s.color}aa`;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (s.id === selectedId) {
      ctx.strokeStyle = '#ffffffcc';
      ctx.lineWidth = 1.5 / transform.k;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 1.9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Star titles appear as you zoom in.
    if (transform.k > 0.9) {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = `rgba(232, 237, 247, ${Math.min(1, (transform.k - 0.9) * 2) * 0.85})`;
      ctx.fillText(s.title, s.x, s.y + 24);
    }
  }
  ctx.restore();
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

export function GalaxyCanvas({
  articles,
  constellations,
  positions,
  selectedId,
  onSelect,
}: GalaxyCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);

  const stars: DrawStar[] = useMemo(() => {
    const colorByConstellation = new Map(constellations.map((c) => [c.id, c.color]));
    const articleById = new Map(articles.map((a) => [a.id, a]));
    return positions.flatMap((p) => {
      const a = articleById.get(p.id);
      if (!a) return [];
      return [
        {
          ...p,
          color: colorByConstellation.get(a.constellation) ?? '#ffffff',
          stub: a.stub,
          title: a.title,
        },
      ];
    });
  }, [articles, constellations, positions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      drawGalaxy(ctx, width, height, stars, constellations, transformRef.current, selectedId);
      ctx.restore();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      render();
    };

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        render();
      });
    zoomRef.current = zoomBehavior;
    const selection = select(canvas);
    selection.call(zoomBehavior);
    // Center the world origin on first mount.
    if (transformRef.current === zoomIdentity) {
      const rect = canvas.getBoundingClientRect();
      selection.call(
        zoomBehavior.transform,
        zoomIdentity.translate(rect.width / 2, rect.height / 2).scale(0.8),
      );
    }

    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const [wx, wy] = transformRef.current.invert([
        event.clientX - rect.left,
        event.clientY - rect.top,
      ]);
      onSelect(hitTest(stars, wx, wy, screenHitRadius(transformRef.current.k)));
    };
    canvas.addEventListener('click', onClick);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      canvas.removeEventListener('click', onClick);
      observer.disconnect();
      selection.on('.zoom', null);
    };
  }, [stars, constellations, selectedId, onSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="galaxy-canvas"
      role="img"
      aria-label="Interactive galaxy map of IT knowledge articles"
    />
  );
}
