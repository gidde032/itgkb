// Freshness gate (#29 decision 2a): the committed content/semantic-map.json
// must describe the content that ships with it. Offline and fast — recompute
// the artifact's inputHash from current content and validate its schema, so
// a content PR that forgets `npm run build:semantic` goes red here (wired
// into gates:quality, so CI and the Pages deploy both enforce it). Full
// output-true verification — regenerate the model and compare — runs as a
// separate CI step; this gate must stay network-free.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATOR_VERSION,
  MODEL_ID,
  MODEL_REVISION,
  computeInputHash,
  readSemanticInputs,
  validateSemanticMap,
} from './semantic-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'content', 'semantic-map.json');
const vecPath = join(root, 'content', 'semantic-vectors.json');

const fail = (messages) => {
  console.error(
    `Semantic map check FAILED (${messages.length} error${messages.length === 1 ? '' : 's'}):`,
  );
  for (const m of messages) console.error(`  - ${m}`);
  process.exit(1);
};

if (!existsSync(mapPath)) {
  fail([
    'content/semantic-map.json is missing — run `npm run build:semantic` (first run downloads the model) and commit the artifact',
  ]);
}

const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const { articles, constellations } = readSemanticInputs(root);
const errors = validateSemanticMap(
  map,
  articles.map((a) => a.id),
  constellations.map((c) => c.id),
);

const expectedHash = computeInputHash(articles, constellations);
if (map.inputHash !== expectedHash) {
  errors.push(
    `stale artifact: inputHash ${map.inputHash} does not match current content (${expectedHash}) — run \`npm run build:semantic\` and commit content/semantic-map.json`,
  );
}

if (errors.length > 0) fail(errors);

// --- semantic-vectors.json (#30) ---
if (!existsSync(vecPath)) {
  fail([
    'content/semantic-vectors.json is missing — run `npm run build:semantic` and commit the artifact',
  ]);
}

const vecs = JSON.parse(readFileSync(vecPath, 'utf8'));
const vecErrors = [];
if (vecs.schemaVersion !== 1)
  vecErrors.push(`semantic-vectors.json: schemaVersion ${vecs.schemaVersion} ≠ 1`);
if (vecs.generatorVersion !== GENERATOR_VERSION)
  vecErrors.push(
    `semantic-vectors.json: generatorVersion ${vecs.generatorVersion} ≠ ${GENERATOR_VERSION} — regenerate with npm run build:semantic`,
  );
if (vecs.model !== MODEL_ID) vecErrors.push(`semantic-vectors.json: model mismatch`);
if (vecs.revision !== MODEL_REVISION) vecErrors.push(`semantic-vectors.json: revision mismatch`);
if (vecs.inputHash !== expectedHash)
  vecErrors.push(
    `semantic-vectors.json: stale inputHash — run \`npm run build:semantic\` and commit`,
  );
if (vecs.inputHash !== map.inputHash)
  vecErrors.push(`semantic-vectors.json: inputHash disagrees with semantic-map.json — regenerate`);

const vecIds = Object.keys(vecs.vectors ?? {}).sort();
const sortedArticleIds = articles.map((a) => a.id).sort();
if (JSON.stringify(vecIds) !== JSON.stringify(sortedArticleIds))
  vecErrors.push('semantic-vectors.json: article coverage does not match content');

const firstVec = Object.values(vecs.vectors ?? {})[0];
if (!Array.isArray(firstVec) || firstVec.length !== (vecs.dimensions ?? 384))
  vecErrors.push(
    `semantic-vectors.json: expected ${vecs.dimensions ?? 384}-dim vectors, got ${firstVec?.length ?? 'none'}`,
  );

if (vecErrors.length > 0) fail(vecErrors);

console.log(
  `Semantic check passed: ${map.stars.length} stars, ${map.edges.length} edges, ${vecIds.length} vectors (${vecs.dimensions ?? '?'} dims), hashes fresh.`,
);
