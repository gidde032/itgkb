import { describe, expect, it } from 'vitest';
import { hitTest } from './draw';

const stars = [
  { id: 's1', x: 0, y: 0 },
  { id: 's2', x: 30, y: 0 },
];

describe('hitTest', () => {
  it('returns the star within the hit radius', () => {
    expect(hitTest(stars, 2, 3)).toBe('s1');
  });
  it('returns null when nothing is within the radius', () => {
    expect(hitTest(stars, 200, 200)).toBeNull();
  });
  it('returns the closest star when hits overlap', () => {
    expect(hitTest(stars, 17, 0)).toBe('s2');
  });
  it('respects a custom radius', () => {
    expect(hitTest(stars, 0, 25, 10)).toBeNull();
    expect(hitTest(stars, 0, 25, 30)).toBe('s1');
  });
});

// F1 regression (reviewer: frontend/interaction, severity High): hit radius
// must be screen-constant across zoom levels, clamped at the extremes.
import { screenHitRadius } from './draw';

describe('screenHitRadius (F1)', () => {
  it('equals the base radius at k=1', () => {
    expect(screenHitRadius(1)).toBe(18);
  });
  it('grows in world units when zoomed out, clamped at 40', () => {
    expect(screenHitRadius(0.5)).toBe(36);
    expect(screenHitRadius(0.3)).toBe(40);
  });
  it('shrinks when zoomed in, clamped at 6', () => {
    expect(screenHitRadius(2)).toBe(9);
    expect(screenHitRadius(4)).toBe(6);
  });
});
