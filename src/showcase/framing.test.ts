import { describe, expect, it } from 'vitest';
import {
  boundingSphere,
  framePoints,
  frameStar,
  framingDistance,
  DEFAULT_VIEW_DIR,
} from './framing';
import type { Vec3 } from './arcGeometry';

describe('boundingSphere', () => {
  it('returns a zero sphere for no points', () => {
    expect(boundingSphere([])).toEqual({ center: [0, 0, 0], radius: 0 });
  });
  it('contains every point', () => {
    const pts: Vec3[] = [
      [-100, 20, -40],
      [80, -60, 120],
      [0, 0, 0],
    ];
    const { center, radius } = boundingSphere(pts);
    for (const p of pts) {
      const d = Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2]);
      expect(d).toBeLessThanOrEqual(radius + 1e-9);
    }
  });
});

describe('framingDistance', () => {
  it('follows sin(fov/2) = radius / distance', () => {
    const d = framingDistance(100, 50, 1);
    expect(d).toBeCloseTo(100 / Math.sin((50 * Math.PI) / 180 / 2));
  });
  it('margin scales the distance', () => {
    expect(framingDistance(100, 50, 1.2)).toBeCloseTo(framingDistance(100, 50, 1) * 1.2);
  });
});

describe('framePoints (#31 decision 13 — constellation framing)', () => {
  const pts: Vec3[] = [
    [-100, 0, 0],
    [100, 0, 0],
    [0, 100, 0],
    [0, -100, 0],
    [0, 0, 100],
    [0, 0, -100],
  ];

  it('targets the bounding-sphere center', () => {
    const frame = framePoints(pts, [0, 0, 1]);
    expect(frame.target).toEqual([0, 0, 0]);
  });

  it('places every point inside the vertical fov half-angle from the camera', () => {
    const fov = 50;
    const frame = framePoints(pts, [0, 0, 1], fov, 1.0);
    const halfFov = (fov * Math.PI) / 180 / 2;
    const forward: Vec3 = [
      frame.target[0] - frame.position[0],
      frame.target[1] - frame.position[1],
      frame.target[2] - frame.position[2],
    ];
    const fl = Math.hypot(...forward);
    for (const p of pts) {
      const v: Vec3 = [
        p[0] - frame.position[0],
        p[1] - frame.position[1],
        p[2] - frame.position[2],
      ];
      const vl = Math.hypot(...v);
      const cos = (v[0] * forward[0] + v[1] * forward[1] + v[2] * forward[2]) / (vl * fl);
      expect(Math.acos(Math.min(1, Math.max(-1, cos)))).toBeLessThanOrEqual(halfFov + 1e-9);
    }
  });

  it('frames a single point without NaNs', () => {
    const frame = framePoints([[5, 5, 5]]);
    for (const c of [...frame.position, ...frame.target]) expect(Number.isFinite(c)).toBe(true);
  });
});

describe('frameStar (FR-7 fly-to counterpart)', () => {
  it('targets the star exactly', () => {
    const frame = frameStar([10, -20, 30], [0, 0, 1]);
    expect(frame.target).toEqual([10, -20, 30]);
  });
  it('sits along the view direction at the framing distance', () => {
    const dir = DEFAULT_VIEW_DIR;
    const frame = frameStar([0, 0, 0], dir, 50, 130, 1);
    const expected = 130 / Math.sin((50 * Math.PI) / 180 / 2);
    const off: Vec3 = [frame.position[0], frame.position[1], frame.position[2]];
    expect(Math.hypot(...off)).toBeCloseTo(expected);
  });
});
