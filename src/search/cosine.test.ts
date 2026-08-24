import { describe, expect, it } from 'vitest';
import { cosine } from './cosine';

describe('cosine', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosine([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosine([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1);
  });

  it('returns 0 when either vector is zero', () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosine([1, 2, 3], [0, 0, 0])).toBe(0);
    expect(cosine([0, 0], [0, 0])).toBe(0);
  });

  it('is scale-invariant', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    const bScaled = b.map((x) => x * 100);
    expect(cosine(a, b)).toBeCloseTo(cosine(a, bScaled));
  });

  it('handles high-dimensional vectors (384-dim)', () => {
    const a = Array.from({ length: 384 }, (_, i) => Math.sin(i));
    const b = Array.from({ length: 384 }, (_, i) => Math.cos(i));
    const result = cosine(a, b);
    expect(result).toBeGreaterThan(-1);
    expect(result).toBeLessThan(1);
  });
});
