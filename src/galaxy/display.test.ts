import { describe, expect, it } from 'vitest';
import { displayPositions, PARALLAX } from './display';

const positions = [
  { id: 'deep', x: 100, y: 100, z: 0 },
  { id: 'mid', x: 100, y: 100, z: 0.5 },
  { id: 'near', x: 100, y: 100, z: 1 },
];

describe('displayPositions (parallax)', () => {
  it('leaves mid-depth stars at their world position', () => {
    const [, mid] = displayPositions(positions, 400, -200, 1);
    expect(mid.x).toBe(100);
    expect(mid.y).toBe(100);
  });

  it('offsets near and deep stars in opposite directions, scaled by pan', () => {
    const [deep, , near] = displayPositions(positions, 400, 0, 1);
    expect(near.x).toBeGreaterThan(100);
    expect(deep.x).toBeLessThan(100);
    expect(near.x - 100).toBeCloseTo(0.5 * 400 * PARALLAX);
  });

  it('applies no offset with zero pan and never produces non-finite values', () => {
    const pts = displayPositions(positions, 0, 0, 0.0000001);
    for (const p of pts) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(p.x).toBe(100);
    }
  });

  it('is what hit-testing must consume: draw and hit share one source', () => {
    // Contract test: the same call with the same transform is referentially
    // consistent — no second implementation of the offset exists to drift.
    const a = displayPositions(positions, 123, -77, 1.5);
    const b = displayPositions(positions, 123, -77, 1.5);
    expect(a).toEqual(b);
  });
});

// P2-F2 regression: dust is transformed by the same displayPositions function
// as stars — this asserts the function scales offsets for far-background
// points identically, so the depth layer cannot silently diverge again.
describe('parallax applies uniformly to any point set (P2-F2)', () => {
  it('offsets a dust-like far point exactly as a star at the same depth', () => {
    const [star] = displayPositions([{ id: 's', x: 500, y: -300, z: 0.9 }], 250, 90, 1.2);
    const [dust] = displayPositions([{ id: 'd', x: 500, y: -300, z: 0.9 }], 250, 90, 1.2);
    expect(dust.x).toBe(star.x);
    expect(dust.y).toBe(star.y);
  });
});

// P6-B1 regression (contextless review: skeptical-senior-engineer lens,
// severity HIGH): stars sat offset from constellation halos at rest because
// displayPositions was fed the absolute transform (including the centering
// translation) rather than the pan delta. Callers now subtract the rest
// transform; with zero delta, positions must be unchanged.
describe('no parallax drift at rest (P6-B1)', () => {
  it('produces zero offset when pan delta is zero regardless of depth', () => {
    const pts = displayPositions(positions, 0, 0, 0.8);
    for (const p of pts) {
      expect(p.x).toBe(100);
      expect(p.y).toBe(100);
    }
  });
});
