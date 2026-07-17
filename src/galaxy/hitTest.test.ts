import { describe, expect, it } from 'vitest';
import { hitTest } from './GalaxyCanvas';

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
