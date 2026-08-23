import type { Constellation } from '../content/types';
import type { ZoomTransform } from 'd3-zoom';
import type { StarLink, RelatedLink } from './links';
import type { DisplayPoint } from './display';
import { hashString } from '../util/hash';

export interface StarMeta {
  color: string;
  stub: boolean;
  title: string;
  summary: string;
  /** Star-catalog id (e.g. GW-014) — the instrument-layer signature. */
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

interface LabelCandidate {
  sx: number;
  sy: number;
  catalog: string;
  title: string;
  color: string;
  showTitle: boolean;
  emphasized: boolean;
  z: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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

/**
 * Screen-space label pass with greedy collision culling. Labels are placed in
 * priority order (hovered/selected first, then nearer stars); a label draws only
 * if its box clears every already-placed label, so clusters never tangle and
 * zooming in reveals more labels as stars separate on screen.
 */
function drawStarLabels(ctx: CanvasRenderingContext2D, candidates: LabelCandidate[]): void {
  const ordered = [...candidates].sort(
    (a, b) => Number(b.emphasized) - Number(a.emphasized) || b.z - a.z,
  );
  const placed: Rect[] = [];
  const ID_FONT = "600 11px 'Hanken Grotesk', system-ui, sans-serif";
  const TITLE_FONT = "500 11px 'Hanken Grotesk', system-ui, sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const c of ordered) {
    ctx.font = ID_FONT;
    const idStr = `[${c.catalog}]`;
    const idW = ctx.measureText(idStr).width;
    let sepW = 0;
    let titleW = 0;
    let titleStr = '';
    if (c.showTitle) {
      ctx.font = TITLE_FONT;
      titleStr = truncateToWidth(ctx, c.title, 180);
      sepW = ctx.measureText('·').width;
      titleW = ctx.measureText(titleStr).width;
    }
    const width = idW + (c.showTitle ? 6 + sepW + 5 + titleW : 0);
    const x0 = c.sx + 12;
    const rect: Rect = { x: x0, y: c.sy - 9, w: width, h: 16 };
    // Emphasised labels (hover/selection) always win — never culled.
    if (!c.emphasized && placed.some((p) => rectsOverlap(rect, p))) continue;
    placed.push(rect);

    const ly = c.sy + 4;
    let lx = x0;
    ctx.font = ID_FONT;
    ctx.fillStyle = c.color;
    ctx.fillText(idStr, lx, ly);
    if (c.showTitle) {
      lx += idW + 6;
      ctx.font = TITLE_FONT;
      ctx.fillStyle = '#5c6884';
      ctx.fillText('·', lx, ly);
      lx += sepW + 5;
      ctx.fillStyle = '#8593b0';
      ctx.fillText(titleStr, lx, ly);
    }
  }
}

/** Deterministic background dust, generated once per mount from a fixed seed. */
export function makeDust(count: number): DisplayPoint[] {
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

export interface Scene {
  points: DisplayPoint[];
  meta: Map<string, StarMeta>;
  links: StarLink[];
  relatedLinks: RelatedLink[];
  dust: DisplayPoint[];
}

/** Pure draw routine, kept outside React for render-on-demand + the twinkle loop. */
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
  time = 0,
  twinkleAmp = 0,
  showRelatedOverlay = false,
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
    ctx.fillText(c.name.toUpperCase().split('').join('  '), c.anchor.x, c.anchor.y - 120);
  }

  const pointById = new Map(scene.points.map((p) => [p.id, p]));

  // Constellation line art beneath the stars. Weighted links (#29 similarity
  // edges) curve gently and scale width/alpha with their weight; unweighted
  // links (curated mode, orphan rescue) render exactly as before.
  ctx.lineWidth = 1 / transform.k;
  for (const link of scene.links) {
    const a = pointById.get(link.a);
    const b = pointById.get(link.b);
    if (!a || !b) continue;
    const color = scene.meta.get(link.a)?.color ?? '#ffffff';
    const linkDimmed = matchIds !== null && (!matchIds.has(link.a) || !matchIds.has(link.b));
    if (link.weight !== undefined) {
      // Curved edge: control point at the midpoint offset perpendicular by a
      // fixed fraction of the chord length, side chosen deterministically by
      // the pair hash so the field reads organic, not combed.
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const side = hashString(`${link.a}|${link.b}`) % 2 === 0 ? 1 : -1;
      const bend = len * 0.12 * side;
      const cx = (a.x + b.x) / 2 + (-(b.y - a.y) / len) * bend;
      const cy = (a.y + b.y) / 2 + ((b.x - a.x) / len) * bend;
      const alpha = Math.round(0x18 + link.weight * 0x30)
        .toString(16)
        .padStart(2, '0');
      ctx.lineWidth = (0.7 + link.weight * 1.5) / transform.k;
      ctx.strokeStyle = linkDimmed ? `${color}10` : `${color}${alpha}`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.stroke();
      continue;
    }
    ctx.lineWidth = 1 / transform.k;
    ctx.strokeStyle = linkDimmed ? `${color}10` : `${color}2e`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Related-article lines: dashed, gradient from source to target constellation color.
  // Drawn when: (a) the overlay toggle is on, or (b) a star is selected (its related lines only).
  if (showRelatedOverlay || selectedId) {
    ctx.setLineDash([6 / transform.k, 4 / transform.k]);
    for (const link of scene.relatedLinks) {
      const a = pointById.get(link.a);
      const b = pointById.get(link.b);
      if (!a || !b) continue;

      const isSelected = link.a === selectedId || link.b === selectedId;
      // When overlay is off and a star is selected, only draw that star's related lines.
      if (!showRelatedOverlay && !isSelected) continue;

      const linkDimmed = matchIds !== null && (!matchIds.has(link.a) || !matchIds.has(link.b));
      // Emphasize the selected star's related lines (brighter, thicker).
      const emphasized = isSelected && selectedId !== null;
      const baseAlpha = linkDimmed ? 0.06 : emphasized ? 0.55 : 0.2;

      ctx.lineWidth = (emphasized ? 1.8 : 1) / transform.k;
      ctx.globalAlpha = baseAlpha;

      // Gradient from source constellation color to target constellation color.
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, link.colorA);
      grad.addColorStop(1, link.colorB);
      ctx.strokeStyle = grad;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1 / transform.k;
  }

  const labelCandidates: LabelCandidate[] = [];
  for (const p of scene.points) {
    const m = scene.meta.get(p.id);
    if (!m) continue;
    const depth = 0.65 + p.z * 0.35;
    const dimmed = matchIds !== null && !matchIds.has(p.id);
    const emphasized = !dimmed && (p.id === selectedId || p.id === hoveredId);
    const r = (emphasized ? 9 : 6) * depth;
    // Living-sky twinkle: gentle per-star glow shimmer. Steady for the star you
    // point at; disabled entirely when twinkleAmp is 0 (reduced motion / tests).
    const twinkle =
      emphasized || twinkleAmp === 0
        ? 1
        : 1 + Math.sin(time * 0.0022 + (hashString(p.id) % 628) / 100) * twinkleAmp;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
    glow.addColorStop(0, m.color);
    glow.addColorStop(0.35, `${m.color}66`);
    glow.addColorStop(1, `${m.color}00`);
    ctx.globalAlpha = (m.stub ? 0.45 : depth) * (dimmed ? 0.15 : 1) * twinkle;
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

    // Collect a label candidate; drawn in a screen-space pass below with greedy
    // collision culling so clusters never tangle.
    if (m.catalog && !dimmed && transform.k > 0.75) {
      labelCandidates.push({
        sx: p.x * transform.k + transform.x,
        sy: p.y * transform.k + transform.y,
        catalog: m.catalog,
        title: m.title,
        color: m.color,
        showTitle: emphasized || transform.k > 1.6,
        emphasized,
        z: p.z,
      });
    }
  }
  ctx.restore();

  drawStarLabels(ctx, labelCandidates);
}
