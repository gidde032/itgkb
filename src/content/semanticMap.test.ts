import { describe, expect, it } from 'vitest';
import { readSemanticInputs } from '../../scripts/semantic-lib.mjs';
import { loadContent } from './load';
import {
  applySemanticConstellations,
  coversArticles,
  isSemanticMap,
  loadSemanticMap,
  type SemanticMap,
} from './semanticMap';
import type { Article } from './types';

function art(id: string, constellation: string): Article {
  return {
    id,
    title: id,
    constellation,
    tags: [],
    summary: 's',
    stub: false,
    related: [],
    body: 'body text',
    sourceName: `${id}.md`,
  };
}

function minimalMap(): SemanticMap {
  return {
    schemaVersion: 1,
    generatorVersion: 1,
    model: 'Xenova/all-MiniLM-L6-v2',
    seed: 42,
    inputHash: 'sha256:' + '0'.repeat(64),
    stars: [
      {
        id: 'a-one',
        constellation: 'beta',
        x: 10,
        y: -20,
        z: 0.5,
        outlier: false,
        strength: 0.6,
      },
    ],
    edges: [{ a: 'a-one', b: 'b-two', weight: 0.5 }],
  };
}

describe('committed semantic artifact (real-content regression, #29)', () => {
  const map = loadSemanticMap();

  it('loads the committed artifact', () => {
    expect(map).not.toBeNull();
  });

  it('covers exactly the real article set — app loader and gate extraction agree', () => {
    const { articles } = loadContent();
    const { articles: gateArticles } = readSemanticInputs(process.cwd());
    expect(map!.stars).toHaveLength(articles.length);
    expect(coversArticles(map!, articles)).toBe(true);
    expect(new Set(gateArticles.map((a: { id: string }) => a.id))).toEqual(
      new Set(articles.map((a) => a.id)),
    );
  });

  it('maps every star to a known constellation with z kept as a depth cue', () => {
    const { constellations } = loadContent();
    const ids = new Set(constellations.map((c) => c.id));
    for (const s of map!.stars) {
      expect(ids.has(s.constellation)).toBe(true);
      expect(s.z).toBeGreaterThanOrEqual(0);
      expect(s.z).toBeLessThanOrEqual(1);
      expect(Number.isFinite(s.x)).toBe(true);
      expect(Number.isFinite(s.y)).toBe(true);
    }
  });

  it('references only known articles in edges, with weights in (0, 1]', () => {
    const known = new Set(map!.stars.map((s) => s.id));
    expect(map!.edges.length).toBeGreaterThan(0);
    for (const e of map!.edges) {
      expect(known.has(e.a)).toBe(true);
      expect(known.has(e.b)).toBe(true);
      expect(e.a).not.toBe(e.b);
      expect(e.weight).toBeGreaterThan(0);
      expect(e.weight).toBeLessThanOrEqual(1);
    }
  });
});

describe('isSemanticMap', () => {
  it('accepts a well-formed map', () => {
    expect(isSemanticMap(minimalMap())).toBe(true);
  });
  it('rejects malformed shapes instead of throwing', () => {
    expect(isSemanticMap(null)).toBe(false);
    expect(isSemanticMap('nope')).toBe(false);
    expect(isSemanticMap({ stars: [], edges: [] })).toBe(false);
    const badZ = minimalMap();
    badZ.stars[0] = { ...badZ.stars[0], z: 1.5 };
    expect(isSemanticMap(badZ)).toBe(false);
    const badWeight = minimalMap();
    badWeight.edges[0] = { ...badWeight.edges[0], weight: 0 };
    expect(isSemanticMap(badWeight)).toBe(false);
    const missingEdges = minimalMap() as unknown as Record<string, unknown>;
    delete missingEdges.edges;
    expect(isSemanticMap(missingEdges)).toBe(false);
  });
});

describe('coversArticles', () => {
  const map = loadSemanticMap()!;
  it('is false for an article the map does not carry', () => {
    expect(coversArticles(map, [art('zzz-not-in-map', 'networking')])).toBe(false);
  });
});

describe('applySemanticConstellations (#29 decision 3a)', () => {
  it('rewrites only the grouping field on the migrated article', () => {
    const a = art('a-one', 'alpha');
    const out = applySemanticConstellations([a], minimalMap());
    expect(out[0].constellation).toBe('beta');
    expect(out[0]).toMatchObject({
      id: 'a-one',
      title: a.title,
      tags: a.tags,
      summary: a.summary,
      body: a.body,
      related: a.related,
    });
  });
  it('passes unmapped and unchanged articles through untouched (same reference)', () => {
    const untouched = art('zzz-not-in-map', 'gamma');
    const sameConstellation = { ...minimalMap().stars[0], constellation: 'alpha' };
    const map = { ...minimalMap(), stars: [sameConstellation] };
    const a = art('a-one', 'alpha');
    const out = applySemanticConstellations([untouched, a], map);
    expect(out[0]).toBe(untouched);
    expect(out[1]).toBe(a);
  });
});
