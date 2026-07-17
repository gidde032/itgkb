import { describe, expect, it } from 'vitest';
import { CuratedForceLayout, hashString, sharedTagCount } from './curatedForce';
import type { Article, Constellation } from '../content/types';

const constellations: Constellation[] = [
  { id: 'alpha', name: 'Alpha', anchor: { x: -300, y: 0 }, color: '#fff' },
  { id: 'beta', name: 'Beta', anchor: { x: 300, y: 0 }, color: '#fff' },
];

function art(id: string, constellation: string, tags: string[]): Article {
  return {
    id,
    title: id,
    constellation,
    tags,
    summary: 's',
    stub: false,
    related: [],
    body: '',
    sourceName: `${id}.md`,
  };
}

const articles: Article[] = [
  art('a1', 'alpha', ['t1', 't2']),
  art('a2', 'alpha', ['t2', 't3']),
  art('a3', 'alpha', ['t9']),
  art('b1', 'beta', ['t4']),
  art('b2', 'beta', ['t4', 't5']),
];

describe('CuratedForceLayout', () => {
  it('is deterministic: same input produces identical positions across runs', () => {
    const p1 = new CuratedForceLayout().layout(articles, constellations);
    const p2 = new CuratedForceLayout().layout(articles, constellations);
    expect(p1).toEqual(p2);
  });

  it('produces finite positions with z in [0,1] for every article', () => {
    const ps = new CuratedForceLayout().layout(articles, constellations);
    expect(ps).toHaveLength(articles.length);
    for (const p of ps) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.z).toBeGreaterThanOrEqual(0);
      expect(p.z).toBeLessThanOrEqual(1);
    }
  });

  it('places stars nearer their own constellation anchor than the other anchor (FR-4)', () => {
    const ps = new CuratedForceLayout().layout(articles, constellations);
    const byId = new Map(ps.map((p) => [p.id, p]));
    for (const a of articles) {
      const p = byId.get(a.id)!;
      const own = constellations.find((c) => c.id === a.constellation)!.anchor;
      const other = constellations.find((c) => c.id !== a.constellation)!.anchor;
      const dOwn = Math.hypot(p.x - own.x, p.y - own.y);
      const dOther = Math.hypot(p.x - other.x, p.y - other.y);
      expect(dOwn).toBeLessThan(dOther);
    }
  });

  it('keeps stars separated (collision force holds a minimum spacing)', () => {
    const ps = new CuratedForceLayout().layout(articles, constellations);
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
        expect(d).toBeGreaterThan(20);
      }
    }
  });

  it('handles an article whose constellation id is unknown by anchoring at origin', () => {
    const ps = new CuratedForceLayout().layout([art('x', 'ghost', [])], constellations);
    expect(ps).toHaveLength(1);
    expect(Math.hypot(ps[0].x, ps[0].y)).toBeLessThan(200);
  });
});

describe('helpers', () => {
  it('hashString is stable and non-negative', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).toBeGreaterThanOrEqual(0);
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
  it('sharedTagCount counts overlapping tags', () => {
    expect(sharedTagCount(art('x', 'alpha', ['a', 'b']), art('y', 'alpha', ['b', 'c']))).toBe(1);
  });
});
