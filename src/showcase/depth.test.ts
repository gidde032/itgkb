import { describe, expect, it } from 'vitest';
import { expandDepth, DEFAULT_DEPTH } from './depth';
import type { Article, Constellation } from '../content/types';
import type { StarPosition } from '../layout/types';

const constellations: Constellation[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    anchor: { x: 0, y: 0 },
    color: '#e4b363',
    prefix: 'ALP',
    depth: { z: -100, spread: 80 },
  },
  { id: 'beta', name: 'Beta', anchor: { x: 100, y: 0 }, color: '#4fc2b0', prefix: 'BET' },
];

function article(id: string, constellation: string): Article {
  return {
    id,
    title: id,
    constellation,
    tags: [],
    summary: '',
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

function pos(id: string, x: number, y: number, z: number): StarPosition {
  return { id, x, y, z };
}

describe('expandDepth (#31 decision 1)', () => {
  const articles = [article('a1', 'alpha'), article('a2', 'alpha'), article('b1', 'beta')];
  const positions = [pos('a1', 10, 20, 0.9), pos('a2', -5, 8, 0.1), pos('b1', 100, 0, 0.5)];

  it('preserves x and y exactly — the 2D galaxy and 3D mode share a plane', () => {
    const out = expandDepth(positions, articles, constellations);
    expect(out.map((p) => [p.id, p.x, p.y])).toEqual([
      ['a1', 10, 20],
      ['a2', -5, 8],
      ['b1', 100, 0],
    ]);
  });

  it('expands z around the curated constellation depth offset', () => {
    const out = expandDepth(positions, articles, constellations);
    const byId = new Map(out.map((p) => [p.id, p.z]));
    // alpha: z3d = -100 + (z - 0.5) * 80
    expect(byId.get('a1')).toBeCloseTo(-100 + (0.9 - 0.5) * 80);
    expect(byId.get('a2')).toBeCloseTo(-100 + (0.1 - 0.5) * 80);
  });

  it('falls back to DEFAULT_DEPTH when the constellation omits depth', () => {
    const out = expandDepth(positions, articles, constellations);
    const b1 = out.find((p) => p.id === 'b1');
    expect(b1?.z).toBeCloseTo(DEFAULT_DEPTH.z + (0.5 - 0.5) * DEFAULT_DEPTH.spread);
    // And stars stay inside the default spread band.
    expect(Math.abs((b1?.z ?? 0) - DEFAULT_DEPTH.z)).toBeLessThanOrEqual(
      DEFAULT_DEPTH.spread / 2 + 1e-9,
    );
  });

  it('is deterministic — same inputs, same outputs', () => {
    const first = expandDepth(positions, articles, constellations);
    const second = expandDepth(positions, articles, constellations);
    expect(first).toEqual(second);
  });

  it('keeps every star within its constellation depth band on the real content', async () => {
    const { loadContent } = await import('../content/load');
    const { CuratedForceLayout } = await import('../layout/curatedForce');
    const content = loadContent();
    const laid = new CuratedForceLayout().layout(content.articles, content.constellations);
    const out = expandDepth(laid, content.articles, content.constellations);
    const byId = new Map(out.map((p) => [p.id, p.z]));
    for (const c of content.constellations) {
      const d = c.depth ?? DEFAULT_DEPTH;
      for (const a of content.articles.filter((x) => x.constellation === c.id)) {
        const z = byId.get(a.id);
        expect(z).toBeGreaterThanOrEqual(d.z - d.spread / 2 - 1e-9);
        expect(z).toBeLessThanOrEqual(d.z + d.spread / 2 + 1e-9);
      }
    }
  });
});
