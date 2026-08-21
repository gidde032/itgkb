import type { Vec3 } from './arcGeometry';

/**
 * Camera framing math for the showcase mode (#31 decisions 4, 13). Pure vector
 * math (no three.js) so it is unit-testable; the scene maps {position, target}
 * onto the camera and orbit controls.
 */

export interface Frame {
  position: Vec3;
  target: Vec3;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

function norm(a: Vec3): Vec3 {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Slightly-elevated front-on default view direction for the whole scene. */
export const DEFAULT_VIEW_DIR: Vec3 = norm([0, 0.35, 1]);

/** Exact bounding sphere (center = axis-aligned box center, radius = max dist). */
export function boundingSphere(points: readonly Vec3[]): { center: Vec3; radius: number } {
  if (points.length === 0) return { center: [0, 0, 0], radius: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[2] < minZ) minZ = p[2];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
    if (p[2] > maxZ) maxZ = p[2];
  }
  const center: Vec3 = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  let radius = 0;
  for (const p of points) {
    const d = len([p[0] - center[0], p[1] - center[1], p[2] - center[2]]);
    if (d > radius) radius = d;
  }
  return { center, radius };
}

/**
 * Distance the camera must sit from `center` so a sphere of `radius` fits the
 * vertical fov with a margin. From the right-triangle relation
 * sin(fov/2) = radius / distance.
 */
export function framingDistance(radius: number, fovDeg: number, margin: number): number {
  const halfFov = (fovDeg * Math.PI) / 180 / 2;
  return (radius * margin) / Math.sin(halfFov);
}

/**
 * Frame a set of points: camera sits along `viewDir` from the bounding-sphere
 * center at the distance where all points fit the fov (times `margin`).
 */
export function framePoints(
  points: readonly Vec3[],
  viewDir: Vec3 = DEFAULT_VIEW_DIR,
  fovDeg = 50,
  margin = 1.15,
): Frame {
  const { center, radius } = boundingSphere(points);
  const dist = framingDistance(Math.max(radius, 1), fovDeg, margin);
  return { position: add(center, scale(norm(viewDir), dist)), target: center };
}

/**
 * Frame a single star (FR-7 fly-to counterpart in 3D): the camera keeps its
 * current view direction and closes to a comfortable reading distance.
 */
export function frameStar(
  star: Vec3,
  viewDir: Vec3,
  fovDeg = 50,
  framingRadius = 130,
  margin = 1.15,
): Frame {
  const dir = norm(viewDir);
  const dist = framingDistance(framingRadius, fovDeg, margin);
  return { position: add(star, scale(dir, dist)), target: star };
}
