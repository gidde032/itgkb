import type { Constellation } from '../content/types';
import type { ZoomTransform } from 'd3-zoom';
import type { StarLink, RelatedLink } from './links';
import type { DisplayPoint } from './display';
import { hashString } from '../util/hash';

export interface StarMeta {
  constellation?: string;
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
  id: string;
  sx: number;
  sy: number;
  catalog: string;
  title: string;
  color: string;
  showTitle: boolean;
  emphasized: boolean;
  z: number;
}

interface ConstellationGeometry {
  id: string;
  points: DisplayPoint[];
  centerX: number;
  centerY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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

function screenPoint(point: DisplayPoint, transform: ZoomTransform): { x: number; y: number } {
  return {
    x: point.x * transform.k + transform.x,
    y: point.y * transform.k + transform.y,
  };
}

function rectAroundPoint(point: { x: number; y: number }, radius: number): Rect {
  return { x: point.x - radius, y: point.y - radius, w: radius * 2, h: radius * 2 };
}

function rectAroundSegment(
  a: { x: number; y: number },
  b: { x: number; y: number },
  padding: number,
): Rect {
  const minX = Math.min(a.x, b.x) - padding;
  const minY = Math.min(a.y, b.y) - padding;
  return {
    x: minX,
    y: minY,
    w: Math.max(1, Math.max(a.x, b.x) - minX + padding),
    h: Math.max(1, Math.max(a.y, b.y) - minY + padding),
  };
}

function nearestConstellationId(
  point: DisplayPoint,
  constellations: readonly Constellation[],
): string | undefined {
  let nearest: string | undefined;
  let distance = Infinity;
  for (const constellation of constellations) {
    const next = Math.hypot(point.x - constellation.anchor.x, point.y - constellation.anchor.y);
    if (next < distance) {
      nearest = constellation.id;
      distance = next;
    }
  }
  return nearest;
}

function constellationGeometry(
  points: readonly DisplayPoint[],
  meta: ReadonlyMap<string, StarMeta>,
  constellations: readonly Constellation[],
): Map<string, ConstellationGeometry> {
  const pointsByConstellation = new Map<string, DisplayPoint[]>();
  for (const point of points) {
    const id =
      meta.get(point.id)?.constellation ??
      (constellations.length === 1
        ? constellations[0].id
        : nearestConstellationId(point, constellations));
    if (!id) continue;
    const group = pointsByConstellation.get(id) ?? [];
    group.push(point);
    pointsByConstellation.set(id, group);
  }

  return new Map(
    constellations.map((constellation) => {
      const group = pointsByConstellation.get(constellation.id) ?? [];
      if (group.length === 0) {
        return [
          constellation.id,
          {
            id: constellation.id,
            points: group,
            centerX: constellation.anchor.x,
            centerY: constellation.anchor.y,
            minX: constellation.anchor.x,
            maxX: constellation.anchor.x,
            minY: constellation.anchor.y,
            maxY: constellation.anchor.y,
          },
        ] as const;
      }
      const minX = Math.min(...group.map((point) => point.x));
      const maxX = Math.max(...group.map((point) => point.x));
      const minY = Math.min(...group.map((point) => point.y));
      const maxY = Math.max(...group.map((point) => point.y));
      return [
        constellation.id,
        {
          id: constellation.id,
          points: group,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
          minX,
          maxX,
          minY,
          maxY,
        },
      ] as const;
    }),
  );
}

function lineObstacles(scene: Scene, transform: ZoomTransform): Rect[] {
  const pointById = new Map(scene.points.map((point) => [point.id, point]));
  return scene.links.flatMap((link) => {
    const a = pointById.get(link.a);
    const b = pointById.get(link.b);
    if (!a || !b) return [];
    const start = screenPoint(a, transform);
    const end = screenPoint(b, transform);
    const obstacles = [rectAroundSegment(start, end, 5)];
    if (link.weight !== undefined) {
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const side = hashString(`${link.a}|${link.b}`) % 2 === 0 ? 1 : -1;
      const bend = len * 0.12 * side;
      const control = screenPoint(
        {
          id: 'control',
          x: (a.x + b.x) / 2 + (-(b.y - a.y) / len) * bend,
          y: (a.y + b.y) / 2 + ((b.x - a.x) / len) * bend,
          z: 0.5,
        },
        transform,
      );
      obstacles.push(rectAroundSegment(start, control, 5), rectAroundSegment(control, end, 5));
    }
    return obstacles;
  });
}

function starObstacles(scene: Scene, transform: ZoomTransform): Map<string, Rect> {
  return new Map(
    scene.points.map((point) => {
      const meta = scene.meta.get(point.id);
      const depth = 0.65 + point.z * 0.35;
      const radius = 6 * depth * transform.k * 2.4 + 4;
      return [
        point.id,
        rectAroundPoint(screenPoint(point, transform), radius + (meta?.stub ? 3 : 0)),
      ];
    }),
  );
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

interface LabelPlacement {
  rect: Rect;
  text: string;
  color: string;
}

function drawConstellationLabels(
  ctx: CanvasRenderingContext2D,
  constellations: readonly Constellation[],
  geometry: ReadonlyMap<string, ConstellationGeometry>,
  transform: ZoomTransform,
  protectedRegions: readonly Rect[],
  selectedConstellationId: string | undefined,
): Rect[] {
  // Keep the canvas constellation names in parity with the 3D `.c-label`
  // treatment: 0.68rem at the app's 16px root, Archivo Narrow, and modest
  // tracked caps rather than the oversized labels used by the first pass.
  ctx.font = "600 11px 'Archivo Narrow', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const placed: LabelPlacement[] = [];
  const ordered = [...constellations].sort(
    (a, b) => Number(b.id === selectedConstellationId) - Number(a.id === selectedConstellationId),
  );

  for (const constellation of ordered) {
    const group = geometry.get(constellation.id);
    if (!group) continue;
    const text = constellation.name.toUpperCase().split('').join(' ');
    const width = ctx.measureText(text).width;
    const height = 16;
    const minX = group.minX * transform.k + transform.x;
    const maxX = group.maxX * transform.k + transform.x;
    const minY = group.minY * transform.k + transform.y;
    const maxY = group.maxY * transform.k + transform.y;
    const centerX = group.centerX * transform.k + transform.x;
    const centerY = group.centerY * transform.k + transform.y;
    const candidates: Rect[] = [
      { x: centerX - width / 2, y: minY - height - 16, w: width, h: height },
      { x: maxX + 16, y: centerY - height / 2, w: width, h: height },
      { x: centerX - width / 2, y: maxY + 16, w: width, h: height },
      { x: minX - width - 16, y: centerY - height / 2, w: width, h: height },
      { x: maxX + 16, y: minY - height - 8, w: width, h: height },
      { x: minX - width - 16, y: minY - height - 8, w: width, h: height },
      { x: maxX + 16, y: maxY + 8, w: width, h: height },
      { x: minX - width - 16, y: maxY + 8, w: width, h: height },
    ];
    const available = candidates.find(
      (rect) =>
        !protectedRegions.some((obstacle) => rectsOverlap(rect, obstacle)) &&
        !placed.some((label) => rectsOverlap(rect, label.rect)),
    );
    const rect = available ?? candidates[0];
    placed.push({ rect, text, color: constellation.color });
  }

  for (const label of placed) {
    // Match the 3D `.c-label` plate: the ink is present but translucent enough
    // that the galaxy does not read as a black box behind the label.
    ctx.fillStyle = '#060a1433';
    ctx.fillRect(label.rect.x - 9, label.rect.y - 5, label.rect.w + 18, label.rect.h + 10);
    ctx.fillStyle = label.color;
    ctx.fillText(label.text, label.rect.x + label.rect.w / 2, label.rect.y + label.rect.h - 3);
  }
  return placed.map((label) => label.rect);
}

/**
 * Screen-space label pass with greedy collision culling. Labels are placed in
 * priority order (hovered/selected first, then nearer stars); a label draws only
 * if its box clears every already-placed label, so clusters never tangle and
 * zooming in reveals more labels as stars separate on screen.
 */
function drawStarLabels(
  ctx: CanvasRenderingContext2D,
  candidates: LabelCandidate[],
  occupied: readonly Rect[],
  starKeepouts: ReadonlyMap<string, Rect>,
): void {
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
    const candidateRects: Rect[] = [
      { x: c.sx + 12, y: c.sy - 9, w: width, h: 16 },
      { x: c.sx + 12, y: c.sy + 12, w: width, h: 16 },
      { x: c.sx - width - 12, y: c.sy - 9, w: width, h: 16 },
      { x: c.sx - width - 12, y: c.sy + 12, w: width, h: 16 },
      { x: c.sx - width / 2, y: c.sy - 28, w: width, h: 16 },
      { x: c.sx - width / 2, y: c.sy + 20, w: width, h: 16 },
    ];
    const available = candidateRects.find(
      (rect) =>
        !placed.some((p) => rectsOverlap(rect, p)) &&
        !occupied.some((p) => rectsOverlap(rect, p)) &&
        ![...starKeepouts].some(([id, keepout]) => id !== c.id && rectsOverlap(rect, keepout)),
    );
    // Emphasised labels remain guaranteed visible; they use the first clear
    // slot when possible and otherwise intentionally take the default slot.
    const rect = available ?? (c.emphasized ? candidateRects[0] : undefined);
    if (!rect) continue;
    placed.push(rect);

    const ly = rect.y + 13;
    let lx = rect.x;
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
  const geometry = constellationGeometry(scene.points, scene.meta, constellations);
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

  // Constellation region halos. Names are placed later in screen space, after
  // stars and lines have supplied the collision obstacles.
  for (const c of constellations) {
    const group = geometry.get(c.id);
    const centerX = group?.centerX ?? c.anchor.x;
    const centerY = group?.centerY ?? c.anchor.y;
    const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 190);
    halo.addColorStop(0, `${c.color}14`);
    halo.addColorStop(1, `${c.color}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
    ctx.fill();
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
        id: p.id,
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

  const selectedConstellationId = selectedId
    ? scene.meta.get(selectedId)?.constellation
    : undefined;
  const starKeepouts = starObstacles(scene, transform);
  const protectedRegions = [...starKeepouts.values(), ...lineObstacles(scene, transform)];
  const constellationLabelRects = drawConstellationLabels(
    ctx,
    constellations,
    geometry,
    transform,
    protectedRegions,
    selectedConstellationId,
  );
  drawStarLabels(
    ctx,
    labelCandidates,
    [...lineObstacles(scene, transform), ...constellationLabelRects],
    starKeepouts,
  );
}
