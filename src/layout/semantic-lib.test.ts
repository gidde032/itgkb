import { describe, expect, it } from 'vitest';
import {
  EDGE_TOP_K,
  KNOT_MAX_RADIUS,
  MODEL_REVISION,
  OUTLIER_MIN_DIST,
  buildSemanticMap,
  assignClustersToConstellations,
  compareArtifacts,
  computeInputHash,
  detectOutliers,
  makeRandom,
  placeStars,
  semanticText,
  selectConstellationPaths,
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
  it('is order-insensitive across articles', () => {
    const shuffled = [...ARTICLES].reverse();
    expect(computeInputHash(shuffled, CONSTELLATIONS)).toBe(
      computeInputHash(ARTICLES, CONSTELLATIONS),
    );
  });
  it('tracks the same authored tag order as the embedding text', () => {
    const a = { ...ARTICLES[0], tags: ['two', 'one'] };
    const b = { ...ARTICLES[0], tags: ['one', 'two'] };
    expect(semanticText(a)).not.toBe(semanticText(b));
    expect(computeInputHash([a], CONSTELLATIONS)).not.toBe(computeInputHash([b], CONSTELLATIONS));
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

describe('selectConstellationPaths', () => {
  const constellationById = new Map(
    IDS.map((id) => [id, id.startsWith('a-') || id === 'o-out' ? 'alpha' : `${id[0]}eta`]),
  );
  const edges = selectConstellationPaths(GROUP_VECTORS, IDS, constellationById);

  it('builds one open, degree-two-capped path inside every mapped constellation', () => {
    for (const constellation of new Set(constellationById.values())) {
      const members = IDS.filter((id) => constellationById.get(id) === constellation);
      const memberSet = new Set(members);
      const internal = edges.filter((edge) => memberSet.has(edge.a) && memberSet.has(edge.b));
      expect(internal).toHaveLength(members.length - 1);
      const degree = new Map(members.map((id) => [id, 0]));
      for (const edge of internal) {
        expect(constellationById.get(edge.a)).toBe(constellationById.get(edge.b));
        degree.set(edge.a, degree.get(edge.a)! + 1);
        degree.set(edge.b, degree.get(edge.b)! + 1);
      }
      for (const value of degree.values()) expect(value).toBeGreaterThanOrEqual(1);
      for (const value of degree.values()) expect(value).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic and sorted', () => {
    expect(edges).toEqual(selectConstellationPaths(GROUP_VECTORS, IDS, constellationById));
    expect(edges).toEqual(
      [...edges].sort((x, y) => (x.a === y.a ? x.b.localeCompare(y.b) : x.a.localeCompare(y.a))),
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
  it('keeps a center-anchored outlier at the required sparse distance', () => {
    const [p] = placeStars({
      ids: ['center-outlier'],
      assignments: [0],
      clusterToConstellation: ['center'],
      strengths: [0],
      outliers: [true],
      edges: [],
      anchors: new Map([['center', { x: 0, y: 0 }]]),
    });
    expect(Math.hypot(p.x, p.y)).toBeGreaterThanOrEqual(OUTLIER_MIN_DIST - 0.01);
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
    expect(star!.outlier).toBe(true);
  });
  it('is deterministic end to end', () => {
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });
  it('keeps display-path selection from changing placement coordinates', () => {
    const map = build();
    const sortedArticles = [...ARTICLES].sort((a, b) => a.id.localeCompare(b.id));
    const sortedIds = sortedArticles.map((article) => article.id);
    const { assignments, strengths } = sphericalKMeans(
      sortedIds.map((id) => GROUP_VECTORS[id]),
      3,
      makeRandom(42),
    );
    const { clusterToConstellation } = assignClustersToConstellations(
      assignments,
      sortedArticles.map((article) => article.constellation),
      CONSTELLATIONS.map((constellation) => constellation.id),
    );
    const placement = placeStars({
      ids: sortedIds,
      assignments,
      clusterToConstellation,
      strengths,
      outliers: detectOutliers(strengths),
      edges: selectEdges(GROUP_VECTORS, sortedIds),
      anchors: new Map(
        CONSTELLATIONS.map((constellation) => [constellation.id, constellation.anchor]),
      ),
    });
    expect(map.stars.map(({ id, x, y, z }) => ({ id, x, y, z }))).toEqual(placement);
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
  it('requires the immutable model revision', () => {
    expect(MODEL_REVISION).toMatch(/^[0-9a-f]{40}$/);
    expect(
      validateSemanticMap({ ...valid, revision: 'main' }, IDS, constellationIds).join(' '),
    ).toMatch(/revision/);
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
  it('rejects cross-constellation, disconnected, and over-degree line art', () => {
    const cross = valid.edges.map(
      (edge: { a: string; b: string; weight: number }, index: number) =>
        index === 0 ? { ...edge, b: edge.b.startsWith('a-') ? 'b-one' : 'a-one' } : edge,
    );
    expect(
      validateSemanticMap({ ...valid, edges: cross }, IDS, constellationIds).join(' '),
    ).toMatch(/crosses mapped constellations|disconnected/);

    const disconnected = valid.edges.slice(1);
    expect(
      validateSemanticMap({ ...valid, edges: disconnected }, IDS, constellationIds).join(' '),
    ).toMatch(/disconnected|path edges/);
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
  it('rejects any position/depth edit by default and allows tolerance only explicitly', () => {
    const nudged = JSON.parse(JSON.stringify(base));
    nudged.stars[0].x += 0.5;
    expect(compareArtifacts(base, nudged).ok).toBe(false);
    expect(compareArtifacts(base, nudged, { maxPositionDelta: 0.5 }).ok).toBe(true);
    const depthEdited = JSON.parse(JSON.stringify(base));
    depthEdited.stars[0].z = 1;
    expect(compareArtifacts(base, depthEdited).ok).toBe(false);
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
