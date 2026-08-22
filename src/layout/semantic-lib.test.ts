import { describe, expect, it } from 'vitest';
import {
  EDGE_TOP_K,
  KNOT_MAX_RADIUS,
  OUTLIER_MIN_DIST,
  buildSemanticMap,
  assignClustersToConstellations,
  compareArtifacts,
  computeInputHash,
  detectOutliers,
  makeRandom,
  placeStars,
  selectEdges,
  sphericalKMeans,
  validateSemanticMap,
} from '../../scripts/semantic-lib.mjs';

// Synthetic 4-dim "embeddings": three tight topic groups along e1/e2/e3 plus
// one article orthogonal to all of them (e4) — the semantic outlier. The lib
// is dimension-agnostic; real MiniLM vectors are 384-dim.
const GROUP_VECTORS: Record<string, number[]> = {
  'a-one': [1, 0.02, -0.01, 0.01],
  'a-two': [1, -0.03, 0.02, 0],
  'a-three': [0.99, 0.01, 0.01, -0.02],
  'a-four': [1.01, 0, -0.02, 0.02],
  'a-five': [0.98, 0.03, 0, 0.01],
  'b-one': [0.02, 1, 0, -0.01],
  'b-two': [-0.01, 0.99, 0.02, 0.01],
  'b-three': [0, 1.01, -0.02, 0],
  'b-four': [0.03, 0.98, 0.01, 0.02],
  'b-five': [-0.02, 1, 0, -0.02],
  'c-one': [0.01, 0, 1, 0.02],
  'c-two': [-0.02, 0.02, 0.99, -0.01],
  'c-three': [0, -0.01, 1.01, 0],
  'c-four': [0.02, 0.01, 0.98, 0.01],
  'c-five': [-0.01, 0, 1.02, -0.02],
  'o-out': [0.05, -0.04, 0.03, 1],
};

const ARTICLES = [
  ...['one', 'two', 'three', 'four', 'five'].map((n) => ({
    id: `a-${n}`,
    title: `Alpha ${n}`,
    summary: 'alpha topic',
    tags: ['alpha'],
    constellation: 'alpha',
  })),
  ...['one', 'two', 'three', 'four', 'five'].map((n) => ({
    id: `b-${n}`,
    title: `Beta ${n}`,
    summary: 'beta topic',
    tags: ['beta'],
    constellation: 'beta',
  })),
  ...['one', 'two', 'three', 'four', 'five'].map((n) => ({
    id: `c-${n}`,
    title: `Gamma ${n}`,
    summary: 'gamma topic',
    tags: ['gamma'],
    constellation: 'gamma',
  })),
  { id: 'o-out', title: 'Odd one', summary: 'unrelated', tags: ['misc'], constellation: 'alpha' },
];

const CONSTELLATIONS = [
  { id: 'alpha', name: 'Alpha', prefix: 'AL', color: '#111111', anchor: { x: -300, y: -100 } },
  { id: 'beta', name: 'Beta', prefix: 'BE', color: '#222222', anchor: { x: 300, y: -100 } },
  { id: 'gamma', name: 'Gamma', prefix: 'GA', color: '#333333', anchor: { x: 0, y: 250 } },
];

const IDS = ARTICLES.map((a) => a.id);

describe('makeRandom', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const r1 = Array.from({ length: 5 }, () => makeRandom(42)());
    const r2 = Array.from({ length: 5 }, () => makeRandom(42)());
    expect(r1).toEqual(r2);
    expect(r1).not.toEqual(Array.from({ length: 5 }, () => makeRandom(43)()));
  });
});

describe('computeInputHash', () => {
  it('matches the sha256:<hex> format', () => {
    expect(computeInputHash(ARTICLES, CONSTELLATIONS)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
  it('is order-insensitive across articles and tags', () => {
    const shuffled = [...ARTICLES].reverse().map((a) => ({ ...a, tags: [...a.tags].reverse() }));
    expect(computeInputHash(shuffled, CONSTELLATIONS)).toBe(
      computeInputHash(ARTICLES, CONSTELLATIONS),
    );
  });
  it('changes when a semantic input changes', () => {
    const retitled = ARTICLES.map((a) => (a.id === 'a-one' ? { ...a, title: 'Changed' } : a));
    expect(computeInputHash(retitled, CONSTELLATIONS)).not.toBe(
      computeInputHash(ARTICLES, CONSTELLATIONS),
    );
    const moved = ARTICLES.map((a) => (a.id === 'o-out' ? { ...a, constellation: 'beta' } : a));
    expect(computeInputHash(moved, CONSTELLATIONS)).not.toBe(
      computeInputHash(ARTICLES, CONSTELLATIONS),
    );
    const reanchored = CONSTELLATIONS.map((c) =>
      c.id === 'alpha' ? { ...c, anchor: { x: -301, y: -100 } } : c,
    );
    expect(computeInputHash(ARTICLES, reanchored)).not.toBe(
      computeInputHash(ARTICLES, CONSTELLATIONS),
    );
  });
});

describe('sphericalKMeans', () => {
  const run = () =>
    sphericalKMeans(
      IDS.map((id) => GROUP_VECTORS[id]),
      3,
      makeRandom(42),
    );
  it('recovers the three synthetic groups', () => {
    const { assignments } = run();
    const groupOf: Record<string, number> = {};
    IDS.forEach((id, i) => (groupOf[id] = assignments[i]));
    for (const prefix of ['a', 'b', 'c']) {
      const members = IDS.filter((id) => id.startsWith(prefix));
      const distinct = new Set(members.map((id) => groupOf[id]));
      expect(distinct.size).toBe(1);
    }
    // ...and the three groups land in three different clusters.
    expect(new Set(['a', 'b', 'c'].map((p) => groupOf[`${p}-one`])).size).toBe(3);
  });
  it('gives members high strength and the orthogonal article low strength', () => {
    const { strengths } = run();
    IDS.forEach((id, i) => {
      if (id === 'o-out') expect(strengths[i]).toBeLessThan(0.35);
      else expect(strengths[i]).toBeGreaterThan(0.9);
    });
  });
  it('is deterministic across runs', () => {
    expect(run().assignments).toEqual(run().assignments);
  });
});

describe('assignClustersToConstellations', () => {
  const { assignments } = sphericalKMeans(
    IDS.map((id) => GROUP_VECTORS[id]),
    3,
    makeRandom(42),
  );
  const authored = ARTICLES.map((a) => a.constellation);
  const ids = CONSTELLATIONS.map((c) => c.id);

  it('recovers the aligned mapping with full agreement', () => {
    const { clusterToConstellation, agreement } = assignClustersToConstellations(
      assignments,
      authored,
      ids,
    );
    // All 16 agree: o-out is authored alpha and lands in the alpha cluster.
    expect(agreement).toBe(16);
    const mapped: Record<string, string> = {};
    IDS.forEach((id, i) => (mapped[id] = clusterToConstellation[assignments[i]]));
    for (const id of IDS) {
      expect(mapped[id]).toBe(ARTICLES.find((a) => a.id === id)!.constellation);
    }
  });
  it('tolerates a migrated article without re-mapping whole constellations', () => {
    const migrated = authored.map((c, i) => (IDS[i] === 'b-two' ? 'alpha' : c));
    const { clusterToConstellation, agreement } = assignClustersToConstellations(
      assignments,
      migrated,
      ids,
    );
    // Optimal stays 15 (b-two's migration is absorbed); the mapping itself
    // holds, so one odd authored label cannot re-shuffle every constellation.
    expect(agreement).toBe(15);
    const betaCluster = assignments[IDS.indexOf('b-one')];
    expect(clusterToConstellation[betaCluster]).toBe('beta');
  });
});

describe('detectOutliers', () => {
  it('flags only strengths below the threshold', () => {
    expect(detectOutliers([0.9, 0.9, 0.1])).toEqual([false, false, true]);
  });
});

describe('selectEdges', () => {
  const edges = selectEdges(GROUP_VECTORS, IDS);
  it('keeps only same-group edges above the threshold', () => {
    const groupOf = (id: string) => id[0];
    expect(edges.length).toBeGreaterThan(0);
    for (const e of edges) {
      expect(groupOf(e.a)).toBe(groupOf(e.b));
      expect(e.weight).toBeGreaterThan(0);
      expect(e.weight).toBeLessThanOrEqual(1);
      expect(e.a < e.b).toBe(true);
    }
  });
  it('respects top-K per article and is deduped', () => {
    const degree = new Map<string, number>();
    for (const e of edges) {
      degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
      degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
    }
    for (const n of degree.values()) expect(n).toBeLessThanOrEqual(EDGE_TOP_K);
    const keys = edges.map((e) => `${e.a}|${e.b}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('is deterministically sorted', () => {
    expect(edges).toEqual(
      [...edges].sort((x: { a: string; b: string }, y: { a: string; b: string }) =>
        x.a === y.a ? (x.b < y.b ? -1 : 1) : x.a < y.a ? -1 : 1,
      ),
    );
  });
});

describe('placeStars', () => {
  const { assignments, strengths } = sphericalKMeans(
    IDS.map((id) => GROUP_VECTORS[id]),
    3,
    makeRandom(42),
  );
  const { clusterToConstellation } = assignClustersToConstellations(
    assignments,
    ARTICLES.map((a) => a.constellation),
    CONSTELLATIONS.map((c) => c.id),
  );
  const outliers = detectOutliers(strengths);
  const edges = selectEdges(GROUP_VECTORS, IDS);
  const anchors = new Map(CONSTELLATIONS.map((c) => [c.id, c.anchor]));

  const place = () =>
    placeStars({
      ids: IDS,
      assignments,
      clusterToConstellation,
      strengths,
      outliers,
      edges,
      anchors,
    });

  it('keeps members inside their knot radius', () => {
    for (const p of place()) {
      const i = IDS.indexOf(p.id);
      const anchor = anchors.get(clusterToConstellation[assignments[i]])!;
      const d = Math.hypot(p.x - anchor.x, p.y - anchor.y);
      if (outliers[i]) continue;
      expect(d).toBeLessThanOrEqual(KNOT_MAX_RADIUS);
    }
  });
  it('isolates outliers in sparse space, hard-normalized into the globe', () => {
    for (const p of place()) {
      const i = IDS.indexOf(p.id);
      if (!outliers[i]) continue;
      const anchor = anchors.get(clusterToConstellation[assignments[i]])!;
      const d = Math.hypot(p.x - anchor.x, p.y - anchor.y);
      expect(d).toBeGreaterThanOrEqual(OUTLIER_MIN_DIST - 0.01);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(620);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(520);
      expect(p.z).toBeGreaterThanOrEqual(0);
      expect(p.z).toBeLessThanOrEqual(1);
    }
  });
  it('is deterministic', () => {
    expect(place()).toEqual(place());
  });
});

describe('buildSemanticMap', () => {
  const build = () =>
    buildSemanticMap({
      articles: ARTICLES,
      constellations: CONSTELLATIONS,
      vectors: GROUP_VECTORS,
    });

  it('produces an artifact that passes validation over the same inputs', () => {
    const map = build();
    const errors = validateSemanticMap(
      map,
      IDS,
      CONSTELLATIONS.map((c) => c.id),
    );
    expect(errors).toEqual([]);
  });
  it('migrates the outlier out of its authored knot', () => {
    const star = build().stars.find((s: { id: string }) => s.id === 'o-out');
    expect(star.outlier).toBe(true);
  });
  it('is deterministic end to end', () => {
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });
  it('throws when an embedding is missing', () => {
    const partial = { ...GROUP_VECTORS } as Record<string, number[]>;
    delete partial['a-one'];
    expect(() =>
      buildSemanticMap({ articles: ARTICLES, constellations: CONSTELLATIONS, vectors: partial }),
    ).toThrow(/missing embedding/);
  });
});

describe('validateSemanticMap', () => {
  const valid = buildSemanticMap({
    articles: ARTICLES,
    constellations: CONSTELLATIONS,
    vectors: GROUP_VECTORS,
  });
  const constellationIds = CONSTELLATIONS.map((c) => c.id);

  it('rejects a stale generator version with a regenerate hint', () => {
    const errs = validateSemanticMap(
      { ...valid, generatorVersion: valid.generatorVersion + 1 },
      IDS,
      constellationIds,
    );
    expect(errs.join(' ')).toMatch(/build:semantic/);
  });
  it('rejects unknown constellations and out-of-range z', () => {
    const stars = valid.stars.map((s: { id: string }) =>
      s.id === 'a-one' ? { ...s, constellation: 'nope' } : s,
    );
    expect(validateSemanticMap({ ...valid, stars }, IDS, constellationIds).join(' ')).toMatch(
      /unknown constellation/,
    );
    const zBad = valid.stars.map((s: { id: string }) => (s.id === 'a-one' ? { ...s, z: 1.2 } : s));
    expect(validateSemanticMap({ ...valid, stars: zBad }, IDS, constellationIds).join(' ')).toMatch(
      /"z"/,
    );
  });
  it('rejects missing articles, duplicate pairs, and unsorted output', () => {
    const missing = validateSemanticMap(
      { ...valid, stars: valid.stars.filter((s: { id: string }) => s.id !== 'a-one') },
      IDS,
      constellationIds,
    );
    expect(missing.join(' ')).toMatch(/missing from the map/);

    const dup = [...valid.edges, valid.edges[0]];
    expect(validateSemanticMap({ ...valid, edges: dup }, IDS, constellationIds).join(' ')).toMatch(
      /duplicate pair/,
    );

    const reversed = [...valid.stars].reverse();
    expect(
      validateSemanticMap({ ...valid, stars: reversed }, IDS, constellationIds).join(' '),
    ).toMatch(/sorted by id/);
  });
});

describe('compareArtifacts', () => {
  const base = buildSemanticMap({
    articles: ARTICLES,
    constellations: CONSTELLATIONS,
    vectors: GROUP_VECTORS,
  });
  it('accepts an identical artifact', () => {
    expect(compareArtifacts(base, JSON.parse(JSON.stringify(base))).ok).toBe(true);
  });
  it('accepts tiny position wobble but rejects it below tolerance', () => {
    const nudged = JSON.parse(JSON.stringify(base));
    nudged.stars[0].x += 0.5;
    expect(compareArtifacts(base, nudged).ok).toBe(true);
    expect(compareArtifacts(base, nudged, { maxPositionDelta: 0.1 }).ok).toBe(false);
  });
  it('rejects a cluster flip and an input-hash change', () => {
    const flipped = JSON.parse(JSON.stringify(base));
    flipped.stars[0].constellation = 'beta';
    expect(compareArtifacts(base, flipped).ok).toBe(false);
    const rehashed = JSON.parse(JSON.stringify(base));
    rehashed.inputHash = 'sha256:' + '0'.repeat(64);
    expect(compareArtifacts(base, rehashed).ok).toBe(false);
  });
});
