import { describe, expect, it } from 'vitest';
import { computeConstellationLinks, computeRelatedLinks } from './links';
import type { Article } from '../content/types';
import { loadContent } from '../content/load';

function art(id: string, constellation: string, tags: string[], related: string[] = []): Article {
  return {
    id,
    title: id,
    constellation,
    tags,
    summary: 's',
    stub: false,
    related,
    body: '',
    sourceName: `${id}.md`,
  };
}

describe('computeConstellationLinks', () => {
  it('links same-constellation stars that share tags, never across constellations', () => {
    const links = computeConstellationLinks([
      art('a1', 'alpha', ['t1']),
      art('a2', 'alpha', ['t1']),
      art('b1', 'beta', ['t1']),
    ]);
    expect(links).toEqual([{ a: 'a1', b: 'a2' }]);
  });

  it('caps greedy-pass degree at 2, keeping the strongest pairs (sky-chart sparsity)', () => {
    // All four stars share tags, so the greedy pass links them. n3 shares only
    // 1 tag with hub and may become an orphan after the degree-2 cap; orphan
    // rescue then reconnects it (possibly exceeding the greedy cap).
    const links = computeConstellationLinks([
      art('hub', 'alpha', ['t1', 't2', 't3']),
      art('n1', 'alpha', ['t1', 't2', 't3']),
      art('n2', 'alpha', ['t1', 't2']),
      art('n3', 'alpha', ['t1']),
    ]);
    // Strongest pair (hub↔n1, 3 shared tags) must survive the cap.
    expect(
      links.some((l) => (l.a === 'hub' && l.b === 'n1') || (l.a === 'n1' && l.b === 'hub')),
    ).toBe(true);
    // Every star must have at least one link (no orphans).
    for (const id of ['hub', 'n1', 'n2', 'n3']) {
      expect(links.some((l) => l.a === id || l.b === id)).toBe(true);
    }
  });

  // L4 regression (v1.1 audit): the greedy pass itself must respect the
  // degree-2 cap. Crafted so every star earns a link from the greedy pass (no
  // orphan rescue): a reaches degree 2 early, so a↔d — despite shared tags —
  // must be REJECTED. Without the cap, a would end at degree 3.
  it('greedy pass alone leaves no star above degree 2 (weak pair rejected)', () => {
    const links = computeConstellationLinks([
      art('a', 'alpha', ['t1', 't2', 't9']),
      art('b', 'alpha', ['t1', 't2']),
      art('c', 'alpha', ['t2']),
      art('d', 'alpha', ['t9', 't8']),
      art('e', 'alpha', ['t8']),
    ]);
    // Greedy: a↔b (2 shared) then a↔c, b↔c, d↔e; a↔d rejected — a is full.
    expect(links).toHaveLength(4);
    expect(links.some((l) => (l.a === 'a' && l.b === 'd') || (l.a === 'd' && l.b === 'a'))).toBe(
      false,
    );
    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.a, (degree.get(l.a) ?? 0) + 1);
      degree.set(l.b, (degree.get(l.b) ?? 0) + 1);
    }
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(degree.get(id)).toBeLessThanOrEqual(2);
      expect(degree.get(id)).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic for equal-strength pairs', () => {
    const input = [art('x', 'alpha', ['t']), art('y', 'alpha', ['t']), art('z', 'alpha', ['t'])];
    expect(computeConstellationLinks(input)).toEqual(computeConstellationLinks(input));
  });

  it('rescues tagless stars via orphan fallback (no star left unlinked)', () => {
    // Before orphan rescue this returned []; now both stars get rescued.
    const links = computeConstellationLinks([art('a', 'alpha', []), art('b', 'alpha', ['q'])]);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({ a: 'a', b: 'b' });
  });

  describe('orphan rescue', () => {
    it('connects a tagless orphan to its nearest sibling when positions are provided', () => {
      const articles = [
        art('linked1', 'alpha', ['t1']),
        art('linked2', 'alpha', ['t1']),
        art('orphan', 'alpha', []),
      ];
      const positions = new Map([
        ['linked1', { x: 0, y: 0 }],
        ['linked2', { x: 100, y: 0 }],
        ['orphan', { x: 10, y: 5 }], // closest to linked1
      ]);
      const links = computeConstellationLinks(articles, positions);
      // orphan should be rescued — connected to linked1 (nearest)
      expect(links.some((l) => l.a === 'linked1' && l.b === 'orphan')).toBe(true);
    });

    it('uses non-spatial fallback (highest degree sibling) without positions', () => {
      const articles = [
        art('linked1', 'alpha', ['t1']),
        art('linked2', 'alpha', ['t1']),
        art('orphan', 'alpha', []),
      ];
      const links = computeConstellationLinks(articles);
      // orphan should still be rescued without positions
      const orphanLinks = links.filter((l) => l.a === 'orphan' || l.b === 'orphan');
      expect(orphanLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('does not create orphan links for a single-star constellation', () => {
      const links = computeConstellationLinks([art('solo', 'alpha', [])]);
      expect(links).toEqual([]);
    });

    it('rescues multiple orphans in the same constellation', () => {
      const articles = [
        art('hub', 'alpha', ['t1']),
        art('connected', 'alpha', ['t1']),
        art('orphan1', 'alpha', []),
        art('orphan2', 'alpha', []),
      ];
      const positions = new Map([
        ['hub', { x: 0, y: 0 }],
        ['connected', { x: 10, y: 0 }],
        ['orphan1', { x: 5, y: 5 }],
        ['orphan2', { x: 50, y: 50 }],
      ]);
      const links = computeConstellationLinks(articles, positions);
      const orphan1Links = links.filter((l) => l.a === 'orphan1' || l.b === 'orphan1');
      const orphan2Links = links.filter((l) => l.a === 'orphan2' || l.b === 'orphan2');
      expect(orphan1Links.length).toBeGreaterThanOrEqual(1);
      expect(orphan2Links.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('regression: real content set — no orphans', () => {
    it('every article has at least one intra-constellation link', () => {
      const { articles } = loadContent();
      // Use positions for spatial orphan rescue (mimicking production flow).
      // Simple grid positions are enough — the test checks connectivity, not layout.
      const positions = new Map(articles.map((a, i) => [a.id, { x: i * 10, y: 0 }]));
      const links = computeConstellationLinks(articles, positions);
      const degree = new Map<string, number>();
      for (const l of links) {
        degree.set(l.a, (degree.get(l.a) ?? 0) + 1);
        degree.set(l.b, (degree.get(l.b) ?? 0) + 1);
      }
      // Every article that has at least one sibling in its constellation must have a link.
      const byCon = new Map<string, string[]>();
      for (const a of articles) {
        const g = byCon.get(a.constellation) ?? [];
        g.push(a.id);
        byCon.set(a.constellation, g);
      }
      for (const [, ids] of byCon) {
        if (ids.length < 2) continue;
        for (const id of ids) {
          expect(
            degree.get(id),
            `Article ${id} has no constellation links (orphan)`,
          ).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });
});

describe('computeRelatedLinks', () => {
  const colors = new Map([
    ['alpha', '#aaa'],
    ['beta', '#bbb'],
  ]);

  it('produces a link from a unidirectional related reference', () => {
    const articles = [art('a', 'alpha', [], ['b']), art('b', 'beta', [])];
    const links = computeRelatedLinks(articles, colors);
    expect(links).toEqual([{ a: 'a', b: 'b', colorA: '#aaa', colorB: '#bbb' }]);
  });

  it('deduplicates bidirectional references', () => {
    const articles = [art('a', 'alpha', [], ['b']), art('b', 'beta', [], ['a'])];
    const links = computeRelatedLinks(articles, colors);
    expect(links).toHaveLength(1);
  });

  it('ignores references to non-existent articles', () => {
    const articles = [art('a', 'alpha', [], ['missing'])];
    const links = computeRelatedLinks(articles, colors);
    expect(links).toEqual([]);
  });

  it('assigns correct constellation colors to endpoints', () => {
    const articles = [art('a', 'alpha', [], ['b']), art('b', 'beta', [], [])];
    const links = computeRelatedLinks(articles, colors);
    expect(links[0].colorA).toBe('#aaa');
    expect(links[0].colorB).toBe('#bbb');
  });

  it('returns links in deterministic sorted order', () => {
    const articles = [
      art('z', 'alpha', [], ['a']),
      art('a', 'alpha', [], ['z']),
      art('m', 'beta', [], ['a']),
    ];
    const links = computeRelatedLinks(articles, colors);
    const keys = links.map((l) => `${l.a}|${l.b}`);
    expect(keys).toEqual([...keys].sort());
  });

  // M1 regression (v1.1 audit): an article listing its own id in `related`
  // must not produce a degenerate self-link (zero-length gradient line).
  it('ignores a self-referencing related entry', () => {
    const articles = [art('a', 'alpha', [], ['a', 'b']), art('b', 'beta', [])];
    const links = computeRelatedLinks(articles, colors);
    expect(links).toEqual([{ a: 'a', b: 'b', colorA: '#aaa', colorB: '#bbb' }]);
  });
});
