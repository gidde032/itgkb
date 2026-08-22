// Shared semantic-layout logic (#29). Used by the build-time generator
// (scripts/generate-semantic-map.mjs), the freshness gate
// (scripts/check-semantic.mjs), and the vitest suite, so clustering,
// placement, and validation cannot drift between them. Plain ESM JS so Node
// can run it unbundled (same convention as validate-lib.mjs).
//
// Everything here is deterministic: same inputs + same seed → byte-identical
// artifact. The ONLY platform-sensitive step (model inference) lives in the
// generator script; outputs are quantized so last-bit float wobble between
// macOS and Linux cannot churn the committed file.

import { createHash } from 'node:crypto';
import { forceSimulation, forceX, forceY, forceCollide, forceLink, forceManyBody } from 'd3-force';

/** Artifact format. Bump on breaking shape changes (old artifacts rejected). */
export const SCHEMA_VERSION = 1;
/**
 * Bump whenever embedding input, model, clustering, or placement math changes
 * in a way that should invalidate committed artifacts. Recorded in the
 * artifact's inputHash, so a bump fails the freshness gate until regenerated.
 */
export const GENERATOR_VERSION = 1;
/** Pinned so the artifact is reproducible; recorded in inputHash. */
export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
/** Single fixed seed for the whole pipeline (mirrors curatedForce's 42). */
export const SEED = 42;

// Tuning constants — changing any of these should bump GENERATOR_VERSION.
export const OUTLIER_STRENGTH_THRESHOLD = 0.35;
export const EDGE_TOP_K = 3;
export const EDGE_MIN_COSINE = 0.45;
/** Members stay within this radius of their knot anchor (post-sim clamp). */
export const KNOT_MAX_RADIUS = 170;
/** Outliers sit in sparse space: at least this far from their knot anchor. */
export const OUTLIER_MIN_DIST = 120;
/** ...and at most this far, so everyone stays inside the globe silhouette. */
export const OUTLIER_MAX_DIST = 260;
/** Galaxy bounds; renderers frame around roughly this extent. */
export const GALAXY_MAX_X = 620;
export const GALAXY_MAX_Y = 520;

/**
 * @typedef {{ id: string, title: string, summary: string, tags: string[],
 *   constellation: string }} SemanticArticle
 */

/** Seeded LCG so layout jitter is reproducible run-to-run (curatedForce twin). */
export function makeRandom(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

function normalizeVector(v) {
  const l = Math.hypot(...v);
  return l === 0 ? v.slice() : v.map((x) => x / l);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Cosine similarity of two equal-length vectors (0 for a zero vector). */
export function cosine(a, b) {
  const la = Math.hypot(...a);
  const lb = Math.hypot(...b);
  if (la === 0 || lb === 0) return 0;
  return dot(a, b) / (la * lb);
}

/**
 * Input identity of the semantic map: sha256 over exactly the fields that
 * feed embeddings (title, summary, tags), the authored constellation (drives
 * cluster→constellation assignment), the curated anchors (drive placement),
 * and the pinned generator version + model. Body text is deliberately NOT
 * hashed — body edits cannot change the artifact, so they must not fail the
 * freshness gate. Order-insensitive: articles and tags are sorted first.
 * @param {SemanticArticle[]} articles
 * @param {Array<Record<string, unknown>>} constellations parsed constellations.json
 * @returns {string} "sha256:<hex>"
 */
export function computeInputHash(articles, constellations) {
  const canonical = {
    generatorVersion: GENERATOR_VERSION,
    model: MODEL_ID,
    articles: [...articles]
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        tags: [...a.tags].sort(),
        constellation: a.constellation,
      })),
    constellations: constellations
      .map((c) => ({
        id: c.id,
        name: c.name,
        prefix: c.prefix,
        color: c.color,
        anchor: { x: c.anchor.x, y: c.anchor.y },
      }))
      .sort((a, b) => (a.id < b.id ? -1 : 1)),
  };
  return 'sha256:' + createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

/**
 * Spherical k-means on raw vectors (normalized internally). k-means++-style
 * farthest-point seeding from a seeded first pick; empty clusters reseed to
 * the worst-fitting vector. Deterministic given the rng.
 * @param {number[][]} vectors
 * @param {number} k
 * @param {() => number} rng
 * @param {number} [maxIterations=100]
 * @returns {{ assignments: number[], centroids: number[][], strengths: number[] }}
 *   strengths[i] = cosine(vectors[i], its centroid) — cluster membership
 *   strength, reused for outlier detection and knot pull.
 */
export function sphericalKMeans(vectors, k, rng, maxIterations = 100) {
  const n = vectors.length;
  k = Math.min(k, n);
  const vecs = vectors.map(normalizeVector);

  // Farthest-point seeding: random first centroid, then always the vector
  // least similar to every chosen centroid.
  const centroidIdx = [Math.floor(rng() * n)];
  while (centroidIdx.length < k) {
    let bestI = -1;
    let bestDist = -Infinity;
    for (let i = 0; i < n; i++) {
      if (centroidIdx.includes(i)) continue;
      let nearest = Infinity;
      for (const c of centroidIdx) nearest = Math.min(nearest, 1 - cosine(vecs[i], vecs[c]));
      if (nearest > bestDist) {
        bestDist = nearest;
        bestI = i;
      }
    }
    centroidIdx.push(bestI);
  }
  let centroids = centroidIdx.map((i) => vecs[i].slice());

  const assignments = new Array(n).fill(-1);
  const strengths = new Array(n).fill(0);
  const assign = () => {
    for (let i = 0; i < n; i++) {
      let bestC = 0;
      let bestS = -Infinity;
      for (let c = 0; c < k; c++) {
        const s = cosine(vecs[i], centroids[c]);
        if (s > bestS) {
          bestS = s;
          bestC = c;
        }
      }
      assignments[i] = bestC;
      strengths[i] = bestS;
    }
  };
  assign();

  for (let iter = 0; iter < maxIterations; iter++) {
    // Centroid = normalized mean of members; empty cluster reseeds to the
    // globally worst-fitting vector so it cannot stay orphaned.
    const members = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) members[assignments[i]].push(i);
    centroids = centroids.map((_, c) => {
      const m = members[c];
      if (m.length === 0) {
        let worstI = 0;
        for (let i = 1; i < n; i++) if (strengths[i] < strengths[worstI]) worstI = i;
        return vecs[worstI].slice();
      }
      const dim = vecs[0].length;
      const mean = new Array(dim).fill(0);
      for (const i of m) for (let d = 0; d < dim; d++) mean[d] += vecs[i][d];
      return normalizeVector(mean);
    });
    const before = assignments.join(',');
    assign();
    if (assignments.join(',') === before) break;
  }
  return { assignments: assignments.slice(), centroids, strengths: strengths.slice() };
}

/**
 * Exact one-to-one mapping of computed clusters onto curated constellations,
 * maximizing agreement with authored membership (k≤8 → ≤40320 permutations,
 * brute force). Names/colors/prefixes survive; articles can migrate.
 * Deterministic tie-break: first optimum in lexicographic permutation order.
 * @param {number[]} assignments cluster index per article
 * @param {string[]} authoredConstellations authored constellation id per article (parallel)
 * @param {string[]} constellationIds
 * @returns {{ clusterToConstellation: string[], agreement: number }}
 */
export function assignClustersToConstellations(
  assignments,
  authoredConstellations,
  constellationIds,
) {
  const k = Math.max(...assignments) + 1;
  if (constellationIds.length > 8) {
    throw new Error('exact assignment supports at most 8 constellations');
  }
  // counts[cluster][constellationIdx] = authored members
  const counts = Array.from({ length: k }, () => new Array(constellationIds.length).fill(0));
  assignments.forEach((c, i) => {
    const ci = constellationIds.indexOf(authoredConstellations[i]);
    if (ci >= 0) counts[c][ci] += 1;
  });

  let bestPerm = null;
  let bestScore = -1;
  const perm = [];
  const used = new Array(constellationIds.length).fill(false);
  const recurse = (depth, score) => {
    if (depth === k) {
      if (score > bestScore) {
        bestScore = score;
        bestPerm = perm.slice();
      }
      return;
    }
    for (let ci = 0; ci < constellationIds.length; ci++) {
      if (used[ci]) continue;
      used[ci] = true;
      perm.push(ci);
      recurse(depth + 1, score + counts[depth][ci]);
      perm.pop();
      used[ci] = false;
    }
  };
  recurse(0, 0);
  return {
    clusterToConstellation: bestPerm.map((ci) => constellationIds[ci]),
    agreement: bestScore,
  };
}

/**
 * An outlier is a star weakly attached to its own cluster — rendered isolated
 * in sparse space rather than inside a knot (#29 decision 6a).
 * @param {number[]} strengths
 * @returns {boolean[]}
 */
export function detectOutliers(strengths) {
  return strengths.map((s) => s < OUTLIER_STRENGTH_THRESHOLD);
}

/**
 * Sparse similarity edges: for each article its top-K most similar articles,
 * kept when cosine ≥ EDGE_MIN_COSINE. Deduped unordered pairs, deterministically
 * sorted. These become the curved, weight-carrying lines of the semantic look.
 * @param {Record<string, number[]>} vectors keyed by article id
 * @param {string[]} ids
 * @returns {{ a: string, b: string, weight: number }[]}
 */
export function selectEdges(vectors, ids) {
  const byPair = new Map();
  for (const id of ids) {
    const scored = ids
      .filter((other) => other !== id)
      .map((other) => ({ other, s: cosine(vectors[id], vectors[other]) }))
      .sort((x, y) => y.s - x.s || (x.other < y.other ? -1 : 1));
    for (const { other, s } of scored.slice(0, EDGE_TOP_K)) {
      if (s < EDGE_MIN_COSINE) continue;
      const [a, b] = id < other ? [id, other] : [other, id];
      const key = a + ' ' + b;
      const prev = byPair.get(key);
      if (prev === undefined || s > prev) byPair.set(key, s);
    }
  }
  // Degree-capped sparsification: undirected top-K per article alone lets a
  // hub exceed K lines (it appears in many others' top-K lists). Admit
  // candidates greedily by weight, ties lexicographic, so every star keeps at
  // most EDGE_TOP_K lines — deterministic and predictably sparse.
  const candidates = [...byPair.entries()]
    .map(([key, s]) => {
      const [a, b] = key.split(' ');
      return { a, b, s };
    })
    .sort((x, y) => y.s - x.s || (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : 1));
  const degree = new Map(ids.map((id) => [id, 0]));
  const kept = candidates.filter(({ a, b }) => {
    if ((degree.get(a) ?? 0) >= EDGE_TOP_K || (degree.get(b) ?? 0) >= EDGE_TOP_K) return false;
    degree.set(a, degree.get(a) + 1);
    degree.set(b, degree.get(b) + 1);
    return true;
  });
  return kept
    .map(({ a, b, s }) => ({ a, b, weight: round3(s) }))
    .sort((e1, e2) => (e1.a < e2.a ? -1 : e1.a > e2.a ? 1 : e1.b < e2.b ? -1 : 1));
}

/**
 * Flat placement in the curated coordinate space: knots form tightly around
 * the mapped constellation's anchor (one layout → galaxy renders it directly,
 * projectGlobe wraps the same coordinates onto the sphere, #29 decision 4a).
 * Members relax under similarity edges; outliers are seeded outward into
 * sparse space and barely tethered. Deterministic d3-force, same pattern as
 * CuratedForceLayout.
 * @param {object} opts
 * @param {string[]} opts.ids article ids (output sorted by id)
 * @param {number[]} opts.assignments cluster index per article (parallel to ids)
 * @param {string[]} opts.clusterToConstellation
 * @param {number[]} opts.strengths membership strength per article (parallel)
 * @param {boolean[]} opts.outliers
 * @param {{ a: string, b: string }[]} opts.edges similarity edges (link force)
 * @param {Map<string, { x: number, y: number }>} opts.anchors constellation id → anchor
 * @returns {{ id: string, x: number, y: number, z: number }[]}
 */
export function placeStars(opts) {
  const { ids, assignments, clusterToConstellation, strengths, outliers, edges, anchors } = opts;
  const rngLayout = makeRandom(SEED);
  const anchorOf = (i) => anchors.get(clusterToConstellation[assignments[i]]) ?? { x: 0, y: 0 };

  const nodes = ids.map((id, i) => {
    const anchor = anchorOf(i);
    if (outliers[i]) {
      // Outward from the galaxy center, rotated ±25° so outliers don't stack
      // on one ray, at 170–250px from their knot's anchor.
      let ux = anchor.x;
      let uy = anchor.y;
      const l = Math.hypot(ux, uy) || 1;
      ux /= l;
      uy /= l;
      const rot = ((rngLayout() - 0.5) * (50 * Math.PI)) / 180;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const dist = 170 + rngLayout() * 80;
      return {
        id,
        anchorX: anchor.x,
        anchorY: anchor.y,
        outlier: true,
        strength: strengths[i],
        x: anchor.x + (ux * cos - uy * sin) * dist,
        y: anchor.y + (ux * sin + uy * cos) * dist,
      };
    }
    const angle = rngLayout() * 2 * Math.PI;
    const radius = 16 + rngLayout() * 44;
    return {
      id,
      anchorX: anchor.x,
      anchorY: anchor.y,
      outlier: false,
      strength: strengths[i],
      x: anchor.x + Math.cos(angle) * radius,
      y: anchor.y + Math.sin(angle) * radius,
    };
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = edges
    .map((e) => ({ source: nodeById.get(e.a), target: nodeById.get(e.b) }))
    .filter((l) => l.source && l.target);

  const sim = forceSimulation(nodes)
    .randomSource(makeRandom(SEED ^ 0x9e37))
    .force(
      'anchorX',
      forceX((d) => d.anchorX).strength((d) => (d.outlier ? 0.015 : 0.08 + 0.3 * d.strength)),
    )
    .force(
      'anchorY',
      forceY((d) => d.anchorY).strength((d) => (d.outlier ? 0.015 : 0.08 + 0.3 * d.strength)),
    )
    .force('charge', forceManyBody().strength(-35).distanceMax(160))
    .force('links', forceLink(links).distance(45).strength(0.35))
    .force('collide', forceCollide(20))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();

  // Hard normalization (#29 decision 6a): clamp everyone into the globe
  // silhouette — members inside their knot, outliers in sparse space.
  const placed = nodes.map((n) => {
    const dx = (n.x ?? 0) - n.anchorX;
    const dy = (n.y ?? 0) - n.anchorY;
    const d = Math.hypot(dx, dy) || 1;
    const cap = n.outlier
      ? Math.min(OUTLIER_MAX_DIST, Math.max(OUTLIER_MIN_DIST, d))
      : Math.min(KNOT_MAX_RADIUS, d);
    const x = Math.max(-GALAXY_MAX_X, Math.min(GALAXY_MAX_X, n.anchorX + (dx / d) * cap));
    const y = Math.max(-GALAXY_MAX_Y, Math.min(GALAXY_MAX_Y, n.anchorY + (dy / d) * cap));
    // z stays the [0,1] depth cue (shell thickness on the globe): knots hug
    // the mean shell, outliers sit slightly off it for an isolated feel.
    const z = n.outlier
      ? 0.5 + (rngLayout() < 0.5 ? -1 : 1) * (0.12 + 0.12 * rngLayout())
      : 0.5 + (rngLayout() - 0.5) * 0.16;
    return { id: n.id, x: round2(x), y: round2(y), z: round2(Math.max(0.05, Math.min(0.95, z))) };
  });
  return placed.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * Full pure pipeline: embeddings in → committed artifact out. The generator
 * script owns model inference and file IO; everything else happens here so it
 * is unit-testable without downloading a model.
 * @param {object} opts
 * @param {SemanticArticle[]} opts.articles
 * @param {Array<Record<string, unknown>>} opts.constellations parsed constellations.json
 * @param {Record<string, number[]>} opts.vectors embedding per article id
 * @returns {{ schemaVersion: number, generatorVersion: number, model: string, seed: number,
 *   inputHash: string, stars: Array<{ id: string, constellation: string, x: number, y: number,
 *   z: number, outlier: boolean, strength: number }>, edges: Array<{ a: string, b: string, weight: number }> }}
 */
export function buildSemanticMap({ articles, constellations, vectors }) {
  if (articles.length === 0) throw new Error('semantic map requires at least one article');
  const sorted = [...articles].sort((a, b) => (a.id < b.id ? -1 : 1));
  const ids = sorted.map((a) => a.id);
  for (const id of ids) {
    if (!vectors[id]) throw new Error(`missing embedding for article "${id}"`);
  }

  const k = constellations.length;
  const { assignments, strengths } = sphericalKMeans(
    ids.map((id) => vectors[id]),
    k,
    makeRandom(SEED),
  );
  const { clusterToConstellation } = assignClustersToConstellations(
    assignments,
    sorted.map((a) => a.constellation),
    constellations.map((c) => c.id),
  );
  const outliers = detectOutliers(strengths);
  const edges = selectEdges(vectors, ids);
  const anchors = new Map(constellations.map((c) => [c.id, c.anchor]));
  const placed = placeStars({
    ids,
    assignments,
    clusterToConstellation,
    strengths,
    outliers,
    edges,
    anchors,
  });
  const placedById = new Map(placed.map((p) => [p.id, p]));

  const stars = sorted.map((a, i) => {
    const p = placedById.get(a.id);
    return {
      id: a.id,
      constellation: clusterToConstellation[assignments[i]],
      x: p.x,
      y: p.y,
      z: p.z,
      outlier: outliers[i],
      strength: round3(strengths[i]),
    };
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    model: MODEL_ID,
    seed: SEED,
    inputHash: computeInputHash(articles, constellations),
    stars,
    edges,
  };
}

/**
 * Gate-time artifact validation. Empty array = valid. Enforces canonical form
 * (sorted, deduped, quantized ranges) so the committed file both cannot drift
 * silently and produces clean git diffs on regeneration.
 * @param {unknown} map parsed content/semantic-map.json
 * @param {string[]} articleIds ids the map must cover exactly
 * @param {string[]} constellationIds
 * @returns {string[]}
 */
export function validateSemanticMap(map, articleIds, constellationIds) {
  const errors = [];
  if (typeof map !== 'object' || map === null || Array.isArray(map))
    return ['semantic-map.json: must be an object'];
  if (map.schemaVersion !== SCHEMA_VERSION)
    errors.push(`semantic-map.json: schemaVersion ${map.schemaVersion} ≠ ${SCHEMA_VERSION}`);
  if (map.generatorVersion !== GENERATOR_VERSION)
    errors.push(
      `semantic-map.json: generatorVersion ${map.generatorVersion} ≠ ${GENERATOR_VERSION} — regenerate with npm run build:semantic`,
    );
  if (map.model !== MODEL_ID)
    errors.push(`semantic-map.json: model "${map.model}" ≠ pinned "${MODEL_ID}"`);
  if (typeof map.seed !== 'number') errors.push('semantic-map.json: "seed" must be a number');
  if (typeof map.inputHash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(map.inputHash))
    errors.push('semantic-map.json: "inputHash" must be "sha256:<hex>"');

  if (!Array.isArray(map.stars))
    return errors.concat('semantic-map.json: "stars" must be an array');
  const known = new Set(articleIds);
  const seen = new Set();
  map.stars.forEach((s, i) => {
    const src = `semantic-map.json stars[${i}]`;
    if (typeof s !== 'object' || s === null) return errors.push(`${src}: must be an object`);
    if (seen.has(s.id)) errors.push(`${src}: duplicate star id "${s.id}"`);
    seen.add(s.id);
    if (!known.has(s.id)) errors.push(`${src}: unknown article id "${s.id}"`);
    if (!constellationIds.includes(s.constellation))
      errors.push(`${src}: unknown constellation "${s.constellation}"`);
    for (const [field, limit] of [
      ['x', GALAXY_MAX_X],
      ['y', GALAXY_MAX_Y],
    ]) {
      if (typeof s[field] !== 'number' || !Number.isFinite(s[field]) || Math.abs(s[field]) > limit)
        errors.push(`${src}: "${field}" must be a finite number within ±${limit}`);
    }
    if (typeof s.z !== 'number' || s.z < 0 || s.z > 1)
      errors.push(`${src}: "z" must be within [0, 1]`);
    if (typeof s.outlier !== 'boolean') errors.push(`${src}: "outlier" must be a boolean`);
    if (typeof s.strength !== 'number' || s.strength < -1 || s.strength > 1)
      errors.push(`${src}: "strength" must be within [-1, 1]`);
  });
  for (const id of articleIds) {
    if (!seen.has(id)) errors.push(`semantic-map.json: article "${id}" missing from the map`);
  }
  const sortedIds = map.stars.map((s) => s.id).every((id, i, arr) => i === 0 || arr[i - 1] < id);
  if (!sortedIds) errors.push('semantic-map.json: "stars" must be sorted by id');

  if (!Array.isArray(map.edges))
    return errors.concat('semantic-map.json: "edges" must be an array');
  const pairs = new Set();
  map.edges.forEach((e, i) => {
    const src = `semantic-map.json edges[${i}]`;
    if (typeof e !== 'object' || e === null) return errors.push(`${src}: must be an object`);
    const { a, b, weight } = e;
    if (typeof a !== 'string' || typeof b !== 'string' || !known.has(a) || !known.has(b) || a === b)
      errors.push(`${src}: "a"/"b" must be two distinct known article ids`);
    if (typeof a === 'string' && typeof b === 'string' && a > b)
      errors.push(`${src}: pair must be stored with a < b`);
    if (typeof a === 'string' && a !== b) {
      const key = a + '|' + b;
      if (pairs.has(key)) errors.push(`${src}: duplicate pair ${key}`);
      pairs.add(key);
    }
    if (typeof weight !== 'number' || weight <= 0 || weight > 1)
      errors.push(`${src}: "weight" must be within (0, 1]`);
  });
  const sortedEdges = map.edges.every((e, i, arr) => {
    if (i === 0) return true;
    const p = arr[i - 1];
    return p.a < e.a || (p.a === e.a && p.b < e.b);
  });
  if (!sortedEdges) errors.push('semantic-map.json: "edges" must be sorted by (a, b)');
  return errors;
}

/**
 * Tolerant artifact comparison for the CI regeneration check: identical
 * inputs must produce semantically identical output even if last-bit float
 * wobble moves a coordinate by a hair or flips a weight's third decimal. A
 * cluster flip or an input-hash change is a real difference.
 * @param {object} a committed artifact
 * @param {object} b freshly regenerated artifact
 * @param {{ maxPositionDelta?: number, maxWeightDelta?: number }} [tolerance]
 * @returns {{ ok: boolean, differences: string[] }}
 */
export function compareArtifacts(a, b, tolerance = {}) {
  const maxPositionDelta = tolerance.maxPositionDelta ?? 0.75;
  const maxWeightDelta = tolerance.maxWeightDelta ?? 0.005;
  const differences = [];
  for (const field of ['schemaVersion', 'generatorVersion', 'model', 'seed', 'inputHash']) {
    if (a[field] !== b[field]) differences.push(`${field}: ${a[field]} ≠ ${b[field]}`);
  }
  const aStars = new Map(a.stars.map((s) => [s.id, s]));
  const bStars = new Map(b.stars.map((s) => [s.id, s]));
  for (const id of new Set([...aStars.keys(), ...bStars.keys()])) {
    const sa = aStars.get(id);
    const sb = bStars.get(id);
    if (!sa || !sb) {
      differences.push(`star ${id}: present in ${sa ? 'committed only' : 'regenerated only'}`);
      continue;
    }
    if (sa.constellation !== sb.constellation)
      differences.push(`star ${id}: constellation ${sa.constellation} ≠ ${sb.constellation}`);
    if (sa.outlier !== sb.outlier) differences.push(`star ${id}: outlier flag differs`);
    for (const f of ['x', 'y', 'z']) {
      if (Math.abs(sa[f] - sb[f]) > maxPositionDelta)
        differences.push(
          `star ${id}: ${f} delta ${Math.abs(sa[f] - sb[f]).toFixed(3)} > ${maxPositionDelta}`,
        );
    }
    if (Math.abs(sa.strength - sb.strength) > maxWeightDelta)
      differences.push(`star ${id}: strength delta > ${maxWeightDelta}`);
  }
  const edgeKey = (e) => e.a + '|' + e.b;
  const aEdges = new Map(a.edges.map((e) => [edgeKey(e), e.weight]));
  const bEdges = new Map(b.edges.map((e) => [edgeKey(e), e.weight]));
  for (const key of new Set([...aEdges.keys(), ...bEdges.keys()])) {
    if (!aEdges.has(key) || !bEdges.has(key)) {
      differences.push(
        `edge ${key}: present in ${aEdges.has(key) ? 'committed only' : 'regenerated only'}`,
      );
    } else if (Math.abs(aEdges.get(key) - bEdges.get(key)) > maxWeightDelta) {
      differences.push(`edge ${key}: weight delta > ${maxWeightDelta}`);
    }
  }
  return { ok: differences.length === 0, differences };
}
