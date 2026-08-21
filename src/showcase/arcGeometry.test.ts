import { describe, expect, it } from 'vitest';
import { arcElevation, hexToRgb01, relatedArc, relatedArcs, ARC_SEGMENTS } from './arcGeometry';

const link = { a: 'star-a', b: 'star-b', colorA: '#ff0000', colorB: '#0000ff' };

describe('hexToRgb01', () => {
  it('parses #rrggbb into [0,1] triples', () => {
    expect(hexToRgb01('#e4b363')).toEqual([0xe4 / 255, 0xb3 / 255, 0x63 / 255]);
  });
  it('returns white for malformed input rather than throwing', () => {
    expect(hexToRgb01('nope')).toEqual([1, 1, 1]);
  });
});

describe('arcElevation (#31 decision 3 — varied, distance- and context-aware)', () => {
  it('grows with chord length', () => {
    expect(arcElevation(100, Infinity)).toBeLessThan(arcElevation(500, Infinity));
  });
  it('caps at LIFT_MAX', () => {
    expect(arcElevation(10000, Infinity)).toBeLessThanOrEqual(120 * (1 + 0.6) + 1e-9);
  });
  it('boosts when another star sits on the chord', () => {
    const clear = arcElevation(300, Infinity);
    const crowded = arcElevation(300, 5);
    expect(crowded).toBeGreaterThan(clear);
  });
});

describe('relatedArc', () => {
  const a = { x: 0, y: 0, z: 0 };
  const b = { x: 300, y: 0, z: 0 };

  it('starts and ends exactly at the two stars', () => {
    const arc = relatedArc(link, a, b, []);
    expect(arc.points[0]).toEqual([0, 0, 0]);
    expect(arc.points[ARC_SEGMENTS]).toEqual([300, 0, 0]);
  });

  it('produces ARC_SEGMENTS+1 finite points with matching per-point colors', () => {
    const arc = relatedArc(link, a, b, []);
    expect(arc.points).toHaveLength(ARC_SEGMENTS + 1);
    expect(arc.colors).toHaveLength(ARC_SEGMENTS + 1);
    for (const p of arc.points) {
      for (const c of p) expect(Number.isFinite(c)).toBe(true);
    }
  });

  it('lerps vertex colors from source color to target color', () => {
    const arc = relatedArc(link, a, b, []);
    expect(arc.colors[0]).toEqual([1, 0, 0]);
    expect(arc.colors[ARC_SEGMENTS]).toEqual([0, 0, 1]);
    const mid = arc.colors[ARC_SEGMENTS / 2];
    expect(mid[0]).toBeCloseTo(0.5);
    expect(mid[2]).toBeCloseTo(0.5);
  });

  it('lifts the arc midpoint off the chord', () => {
    const arc = relatedArc(link, a, b, []);
    const mid = arc.points[ARC_SEGMENTS / 2];
    const offChord = Math.hypot(mid[1], mid[2]); // chord runs along x
    expect(offChord).toBeGreaterThan(0);
  });

  it('arches higher for a longer link (same crowding)', () => {
    const short = relatedArc(link, a, { x: 80, y: 0, z: 0 }, []);
    const long = relatedArc(link, a, { x: 600, y: 0, z: 0 }, []);
    const lift = (arc: typeof short) =>
      Math.hypot(arc.points[ARC_SEGMENTS / 2][1], arc.points[ARC_SEGMENTS / 2][2]);
    expect(lift(long)).toBeGreaterThan(lift(short));
  });

  it('arches higher when an intervening star sits near the chord', () => {
    const clear = relatedArc(link, a, b, [{ x: 150, y: 500, z: 0 }]);
    const crowded = relatedArc(link, a, b, [{ x: 150, y: 4, z: 0 }]);
    const lift = (arc: typeof clear) =>
      Math.hypot(arc.points[ARC_SEGMENTS / 2][1], arc.points[ARC_SEGMENTS / 2][2]);
    expect(lift(crowded)).toBeGreaterThan(lift(clear));
  });

  it('is deterministic — same link, same geometry', () => {
    const one = relatedArc(link, a, b, []);
    const two = relatedArc(link, a, b, []);
    expect(one).toEqual(two);
  });

  it('varies direction between different links (hash-seeded)', () => {
    const other = { ...link, a: 'star-c', b: 'star-d' };
    const one = relatedArc(link, a, b, []);
    const two = relatedArc(other, a, b, []);
    expect(one.points).not.toEqual(two.points);
  });

  it('handles a vertical chord without producing NaN', () => {
    const arc = relatedArc(link, { x: 0, y: -50, z: 0 }, { x: 0, y: 50, z: 0 }, []);
    for (const p of arc.points) for (const c of p) expect(Number.isFinite(c)).toBe(true);
  });
});

describe('relatedArcs', () => {
  it('skips links whose endpoints are missing from the position map', () => {
    const arcs = relatedArcs([link], new Map([[link.a, { x: 0, y: 0, z: 0 }]]));
    expect(arcs).toEqual([]);
  });

  it('computes one arc per resolvable link, keyed by id pair', () => {
    const pos = new Map([
      [link.a, { x: 0, y: 0, z: 0 }],
      [link.b, { x: 100, y: 0, z: 0 }],
    ]);
    const arcs = relatedArcs([link], pos);
    expect(arcs).toHaveLength(1);
    expect(arcs[0].id).toBe(`${link.a}|${link.b}`);
  });
});
