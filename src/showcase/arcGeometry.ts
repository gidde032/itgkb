import type { RelatedLink } from '../galaxy/links';
import { hashString } from '../util/hash';

/**
 * Related-article arc geometry (#31 decision 3): dashed gradient arcs whose
 * elevation VARIES per link — a function of endpoint distance and the stars
 * around the chord (long or crowded links arch higher). Deterministic: the arc
 * direction is hash-seeded from the link's ids, never random at render time.
 *
 * Pure math only (no three.js) so it is unit-testable in jsdom; the renderer
 * feeds `points`/`colors` straight into a Line2 with vertex colors.
 */

export type Vec3 = [number, number, number];

export interface RelatedArc {
  /** `${a}|${b}` — stable key for React and emphasis lookups. */
  id: string;
  /** Sampled quadratic-bezier points from source to target star. */
  points: Vec3[];
  /** Per-point RGB in [0,1], lerping source → target constellation color. */
  colors: Vec3[];
}

/** Samples per arc (visual smoothness vs. buffer size). */
export const ARC_SEGMENTS = 24;

const LIFT_MIN = 30;
const LIFT_K = 0.18;
const LIFT_MAX = 120;
/** Stars closer than this to the chord boost the arc's elevation. */
const CROWD_RADIUS = 42;
const CROWD_BOOST = 0.6;

interface P3 {
  x: number;
  y: number;
  z: number;
}

/** Parse a #rrggbb constellation color into linear [0,1] RGB. */
export function hexToRgb01(hex: string): Vec3 {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [1, 1, 1];
  const n = Number.parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Squared distance from point p to segment ab (closest-point projection). */
function pointSegmentDist2(p: P3, a: P3, b: P3): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const apz = p.z - a.z;
  const denom = abx * abx + aby * aby + abz * abz;
  const t = denom === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / denom));
  const dx = apx - abx * t;
  const dy = apy - aby * t;
  const dz = apz - abz * t;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Arc elevation for one link: base grows with chord length (capped), boosted
 * when other stars sit near the chord so the arc lifts over intervening
 * structure rather than threading through it.
 */
export function arcElevation(chordLength: number, nearestOtherDist: number): number {
  const base = Math.min(LIFT_MAX, LIFT_MIN + chordLength * LIFT_K);
  const crowd =
    nearestOtherDist < CROWD_RADIUS ? (1 - nearestOtherDist / CROWD_RADIUS) * CROWD_BOOST : 0;
  return base * (1 + crowd);
}

/**
 * Compute one related-link arc. `others` is every 3D star position except the
 * two endpoints (used for the crowding term).
 */
export function relatedArc(
  link: Pick<RelatedLink, 'a' | 'b' | 'colorA' | 'colorB'>,
  aPos: P3,
  bPos: P3,
  others: readonly P3[],
): RelatedArc {
  const dx = bPos.x - aPos.x;
  const dy = bPos.y - aPos.y;
  const dz = bPos.z - aPos.z;
  const len = Math.hypot(dx, dy, dz) || 1e-9;
  const dn: Vec3 = [dx / len, dy / len, dz / len];

  // Perpendicular basis: the component of +Y perpendicular to the chord, plus
  // its cross product with the chord. Arc directions vary over that plane via a
  // hash of the link ids — biased toward "arch up" without being combed flat.
  let pux = -dn[0] * dn[1];
  let puy = 1 - dn[1] * dn[1];
  let puz = -dn[2] * dn[1];
  const puLen = Math.hypot(pux, puy, puz);
  if (puLen < 1e-6) {
    // Chord is vertical — fall back to +Z as the "up" reference.
    pux = 0;
    puy = 0;
    puz = 1;
  } else {
    pux /= puLen;
    puy /= puLen;
    puz /= puLen;
  }
  const pv: Vec3 = [
    dn[1] * puz - dn[2] * puy,
    dn[2] * pux - dn[0] * puz,
    dn[0] * puy - dn[1] * pux,
  ];

  const theta = ((hashString(`${link.a}|${link.b}`) % 1000) / 1000) * Math.PI * 2;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  let ox = pux * cos + pv[0] * sin;
  let oy = puy * cos + pv[1] * sin;
  let oz = puz * cos + pv[2] * sin;
  const oLen = Math.hypot(ox, oy, oz) || 1;
  ox /= oLen;
  oy /= oLen;
  oz /= oLen;

  let nearest2 = Infinity;
  for (const o of others) {
    const d2 = pointSegmentDist2(o, aPos, bPos);
    if (d2 < nearest2) nearest2 = d2;
  }
  const elevation = arcElevation(len, Math.sqrt(nearest2));

  const mid: P3 = {
    x: (aPos.x + bPos.x) / 2 + ox * elevation,
    y: (aPos.y + bPos.y) / 2 + oy * elevation,
    z: (aPos.z + bPos.z) / 2 + oz * elevation,
  };

  const colorA = hexToRgb01(link.colorA);
  const colorB = hexToRgb01(link.colorB);

  const points: Vec3[] = [];
  const colors: Vec3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = i / ARC_SEGMENTS;
    const u = 1 - t;
    points.push([
      u * u * aPos.x + 2 * u * t * mid.x + t * t * bPos.x,
      u * u * aPos.y + 2 * u * t * mid.y + t * t * bPos.y,
      u * u * aPos.z + 2 * u * t * mid.z + t * t * bPos.z,
    ]);
    colors.push([
      colorA[0] * u + colorB[0] * t,
      colorA[1] * u + colorB[1] * t,
      colorA[2] * u + colorB[2] * t,
    ]);
  }

  return { id: `${link.a}|${link.b}`, points, colors };
}

/** Convenience wrapper: compute every related-link arc at once. */
export function relatedArcs(
  links: readonly Pick<RelatedLink, 'a' | 'b' | 'colorA' | 'colorB'>[],
  positionById: ReadonlyMap<string, P3>,
): RelatedArc[] {
  const arcs: RelatedArc[] = [];
  for (const link of links) {
    const a = positionById.get(link.a);
    const b = positionById.get(link.b);
    if (!a || !b) continue;
    const others: P3[] = [];
    for (const [id, p] of positionById) {
      if (id !== link.a && id !== link.b) others.push(p);
    }
    arcs.push(relatedArc(link, a, b, others));
  }
  return arcs;
}

/** Samples for a bent constellation link (fewer than arcs — subtle curvature). */
const BEND_SEGMENTS = 8;
/** Bend grows with chord length, capped so knots never loop. */
const BEND_K = 0.15;
const BEND_MAX = 70;

/**
 * #29: sampled quadratic-bezier points for a gently bent, weighted
 * constellation link — the 3D twin of the galaxy's curved similarity edges.
 * Direction: the component of +Y perpendicular to the chord (+Z fallback for
 * vertical chords). Deterministic, crowding-blind (knots are tight by
 * construction; only the sparse outliers produce long chords).
 */
export function bentLinkPoints(a: Vec3, b: Vec3): Vec3[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz) || 1e-9;
  let px = -dz;
  let py = 0;
  let pz = dx; // cross([0,1,0], d)
  const pl = Math.hypot(px, py, pz);
  if (pl < 1e-6) {
    px = 1;
    py = 0;
    pz = 0; // vertical chord — fall back to +X
  } else {
    px /= pl;
    pz /= pl;
  }
  const elevation = Math.min(BEND_MAX, len * BEND_K);
  const mx = (a[0] + b[0]) / 2 + px * elevation;
  const my = (a[1] + b[1]) / 2 + py * elevation;
  const mz = (a[2] + b[2]) / 2 + pz * elevation;
  const points: Vec3[] = [];
  for (let i = 0; i <= BEND_SEGMENTS; i++) {
    const t = i / BEND_SEGMENTS;
    const u = 1 - t;
    points.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
      u * u * a[2] + 2 * u * t * mz + t * t * b[2],
    ]);
  }
  return points;
}
