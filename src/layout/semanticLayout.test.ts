import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load';
import { loadSemanticMap } from '../content/semanticMap';
import type { SemanticMap } from '../content/semanticMap';
import { SemanticLayout } from './semanticLayout';
import type { Article } from '../content/types';

function art(id: string, constellation: string): Article {
  return {
    id,
    title: id,
    constellation,
    tags: [],
    summary: 's',
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

function mapWithStars(stars: Array<{ id: string; x: number; y: number; z: number }>): SemanticMap {
  return {
    schemaVersion: 1,
    generatorVersion: 1,
    model: 'm',
    seed: 42,
    inputHash: 'sha256:' + '0'.repeat(64),
    stars: stars.map((s) => ({ ...s, constellation: 'alpha', outlier: false, strength: 0.5 })),
    edges: [],
  };
}

describe('SemanticLayout (#29)', () => {
  it('returns positions in article order, with artifact coordinates verbatim', () => {
    const map = mapWithStars([
      { id: 'a-one', x: 12.5, y: -40.25, z: 0.3 },
      { id: 'b-two', x: -8, y: 100, z: 0.9 },
    ]);
    // Input order deliberately differs from artifact order.
    const positions = new SemanticLayout(map).layout([
      art('b-two', 'alpha'),
      art('a-one', 'alpha'),
    ]);
    expect(positions).toEqual([
      { id: 'b-two', x: -8, y: 100, z: 0.9 },
      { id: 'a-one', x: 12.5, y: -40.25, z: 0.3 },
    ]);
  });

  it('real artifact over real content: every article placed, finite, z∈[0,1]', () => {
    const { articles } = loadContent();
    const map = loadSemanticMap()!;
    const positions = new SemanticLayout(map).layout(articles);
    expect(positions).toHaveLength(articles.length);
    const byId = new Map(map.stars.map((s) => [s.id, s]));
    for (const p of positions) {
      const s = byId.get(p.id)!;
      expect(p.x).toBe(s.x);
      expect(p.y).toBe(s.y);
      expect(p.z).toBe(s.z);
      expect(p.z).toBeGreaterThanOrEqual(0);
      expect(p.z).toBeLessThanOrEqual(1);
    }
  });
});
