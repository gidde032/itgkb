import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';
import type { Vec3 } from './arcGeometry';

/**
 * Celestial-globe projection (#31, maintainer-directed amendment 2026-08-21):
 * constellations sit ON a sphere like a star globe — each figure's direction
 * is derived from its curated 2D anchor (so the hand-placed adjacency
 * survives), local force-layout offsets become tangent-plane figure spread
 * (tag affinity within a figure is preserved), and the hash-derived parallax z
 * becomes shell thickness. Deterministic; downstream of the LayoutProvider
 * seam, so a semantic layout (#29) flows through unchanged.
 */
export interface StarPosition3D {
  id: string;
  x: number;
  y: number;
  z: number;
}

export const GLOBE_RADIUS = 400;
export const SHELL_THICKNESS = 55;
export const LOCAL_SPREAD_SCALE = 0.85;
/** Curated anchors span x ∈ [-400, 400], y ∈ [-320, 320]; mapped to lon/lat. */
const LON_SCALE = (170 * Math.PI) / 180;
const MAX_LAT = (70 * Math.PI) / 180;

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Angle between two directions, in radians. */
export function angleBetween(a: Vec3, b: Vec3): number {
  const d = Math.min(1, Math.max(-1, dot(normalize(a), normalize(b))));
  return Math.acos(d);
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Constellation direction on the globe, derived from its curated 2D anchor. */
export function anchorDirection(anchor: { x: number; y: number }): Vec3 {
  const lon = (anchor.x / 400) * LON_SCALE;
  const lat = Math.max(-1, Math.min(1, -anchor.y / 320)) * MAX_LAT;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

/** East/north tangent basis at a unit direction (y is the globe's north pole). */
function tangentBasis(dir: Vec3): { east: Vec3; north: Vec3 } {
  let east = cross([0, 1, 0], dir);
  if (Math.hypot(east[0], east[1], east[2]) < 1e-6) east = [1, 0, 0]; // at a pole
  east = normalize(east);
  const north = normalize(cross(dir, east));
  return { east, north };
}

export function projectGlobe(
  positions: readonly StarPosition[],
  articles: readonly Article[],
  constellations: readonly Constellation[],
): StarPosition3D[] {
  const constellationOf = new Map(articles.map((a) => [a.id, a.constellation]));
  const anchorById = new Map(constellations.map((c) => [c.id, c.anchor]));
  return positions.map((p) => {
    const anchor = anchorById.get(constellationOf.get(p.id) ?? '') ?? { x: 0, y: 0 };
    const dir = anchorDirection(anchor);
    const { east, north } = tangentBasis(dir);
    const dx = p.x - anchor.x;
    const dy = p.y - anchor.y;
    // Canvas y grows downward, so -dy is "north" on the globe.
    const t = normalize([
      east[0] * dx - north[0] * dy,
      east[1] * dx - north[1] * dy,
      east[2] * dx - north[2] * dy,
    ]);
    const phi = (Math.hypot(dx, dy) * LOCAL_SPREAD_SCALE) / GLOBE_RADIUS;
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    const starDir: Vec3 = [
      dir[0] * cos + t[0] * sin,
      dir[1] * cos + t[1] * sin,
      dir[2] * cos + t[2] * sin,
    ];
    const r = GLOBE_RADIUS + (p.z - 0.5) * SHELL_THICKNESS;
    return { id: p.id, x: starDir[0] * r, y: starDir[1] * r, z: starDir[2] * r };
  });
}
