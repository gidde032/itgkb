// Build-time semantic-map generator (#29): embeds every article locally with
// a pinned MiniLM model via transformers.js (devDependency — never bundled,
// never in the browser; no key, no server), then delegates ALL math to
// semantic-lib.mjs and writes the committed content/semantic-map.json.
// Run via `npm run build:semantic` after content changes; the freshness gate
// (check-semantic.mjs) fails CI until the artifact is regenerated.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline, env } from '@huggingface/transformers';
import { MODEL_ID, buildSemanticMap, readSemanticInputs } from './semantic-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  // Cache the one-time model download under .cache/ (gitignored) instead of
  // inside node_modules, so reinstalling dependencies keeps the model warm.
  env.cacheDir = join(root, '.cache');
  env.allowLocalModels = false; // always fetch from the hub — no model tree in the repo

  const { articles, constellations } = readSemanticInputs(root);

  console.log(`Embedding ${articles.length} articles with ${MODEL_ID}…`);
  const extractor = await pipeline('feature-extraction', MODEL_ID);
  // Embedding input is title + summary + tags only: topical signal, short
  // enough for MiniLM's 256-token window, and independent of body rewrites.
  // The authored constellation is deliberately excluded — semantics must be
  // free to disagree with curation (#29 decision 3a).
  const texts = articles.map((a) => `${a.title}. ${a.summary}. ${a.tags.join(', ')}`);
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  const rows = output.tolist();
  const vectors = Object.fromEntries(articles.map((a, i) => [a.id, rows[i]]));

  const map = buildSemanticMap({ articles, constellations, vectors });
  const outPath = join(root, 'content', 'semantic-map.json');
  writeFileSync(outPath, JSON.stringify(map, null, 2) + '\n');

  const sizes = {};
  for (const s of map.stars) sizes[s.constellation] = (sizes[s.constellation] ?? 0) + 1;
  const outlierIds = map.stars.filter((s) => s.outlier).map((s) => s.id);
  console.log(`Wrote ${outPath}`);
  console.log(
    `  stars: ${map.stars.length}, edges: ${map.edges.length}, outliers: ${outlierIds.length}${outlierIds.length ? ` (${outlierIds.join(', ')})` : ''}`,
  );
  console.log(`  constellation sizes: ${JSON.stringify(sizes)}`);
}

main().catch((e) => {
  console.error('build:semantic FAILED:', e?.message ?? e);
  process.exit(1);
});
