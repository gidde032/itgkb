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
import { computeInputHash, readSemanticInputs, validateSemanticMap } from './semantic-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = join(root, 'content', 'semantic-map.json');

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
console.log(
  `Semantic map check passed: ${map.stars.length} stars, ${map.edges.length} edges, hash fresh.`,
);
