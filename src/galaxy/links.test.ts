import { describe, expect, it } from 'vitest';
import { computeConstellationLinks } from './links';
import type { Article } from '../content/types';

function art(id: string, constellation: string, tags: string[]): Article {
  return { id, title: id, constellation, tags, summary: 's', stub: false, related: [], body: '', sourceName: `${id}.md` };
}

describe('computeConstellationLinks', () => {
  it('links same-constellation stars that share tags, never across constellations', () => {
    const links = computeConstellationLinks([
      art('a1', 'alpha', ['t1']),
      art('a2', 'alpha', ['t1']),
      art('b1', 'beta', ['t1']),
    ]);
    expect(links).toEqual([{ a: 'a1', b: 'a2', strength: 1 }]);
  });

  it('caps degree at 2 per star, keeping the strongest pairs (sky-chart sparsity)', () => {
    const links = computeConstellationLinks([
      art('hub', 'alpha', ['t1', 't2', 't3']),
      art('n1', 'alpha', ['t1', 't2', 't3']),
      art('n2', 'alpha', ['t1', 't2']),
      art('n3', 'alpha', ['t1']),
    ]);
    const hubDegree = links.filter((l) => l.a === 'hub' || l.b === 'hub').length;
    expect(hubDegree).toBeLessThanOrEqual(2);
    // Strongest pair (hub↔n1, 3 shared tags) must survive the cap.
    expect(links.some((l) => (l.a === 'hub' && l.b === 'n1') || (l.a === 'n1' && l.b === 'hub'))).toBe(true);
  });

  it('is deterministic for equal-strength pairs', () => {
    const input = [art('x', 'alpha', ['t']), art('y', 'alpha', ['t']), art('z', 'alpha', ['t'])];
    expect(computeConstellationLinks(input)).toEqual(computeConstellationLinks(input));
  });

  it('returns no links for tagless or unrelated stars', () => {
    expect(computeConstellationLinks([art('a', 'alpha', []), art('b', 'alpha', ['q'])])).toEqual([]);
  });
});
